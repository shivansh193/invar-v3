/**
 * Real browser-based security scanner using Playwright.
 *
 * Local dev:   uses the full `playwright` package with locally installed Chromium.
 * Vercel/prod: uses `playwright-core` + `@sparticuz/chromium` (Lambda-compatible,
 *              ~45 MB compressed binary included in the deployment bundle).
 *
 * Set VERCEL=1 or AWS_LAMBDA_FUNCTION_VERSION to activate the serverless path.
 */

import type { Browser, BrowserContext, Page, Response as PwResponse } from 'playwright-core'

export interface ScanFinding {
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
  description: string
  evidence: string
  remediation: string
}

export interface ScanEvent {
  progress: number
  message: string
  finding?: ScanFinding
}

type Emit = (event: ScanEvent, eventName?: string) => void

// ---------------------------------------------------------------------------
// Browser bootstrap — swaps implementation based on environment
// ---------------------------------------------------------------------------
async function launchBrowser(): Promise<Browser> {
  const isServerless = !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_VERSION ||
    process.env.USE_SERVERLESS_CHROME
  )

  if (isServerless) {
    const { chromium } = await import('playwright-core')
    const chromiumBin = (await import('@sparticuz/chromium')).default
    return chromium.launch({
      args: chromiumBin.args,
      executablePath: await chromiumBin.executablePath(),
      headless: true,
    })
  }

  // Local dev: let playwright pick its own installed browser (headless shell).
  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TOKEN_KEY = /token|auth|jwt|session|access|refresh|credential|bearer|secret|apikey|api_key/i
const JWT_VALUE = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/

function truncate(s: string, n = 72): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

// ---------------------------------------------------------------------------
// Main scanner
// ---------------------------------------------------------------------------
export async function runScan(targetUrl: string, emit: Emit): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = []

  const log = (progress: number, message: string) =>
    emit({ progress, message })

  const report = (progress: number, finding: ScanFinding) => {
    findings.push(finding)
    emit({
      progress,
      message: `⚠ Found: ${finding.title}`,
      finding,
    })
  }

  const browser = await launchBrowser()

  try {
    // -----------------------------------------------------------------------
    // Phase 1 — Reach the target
    // -----------------------------------------------------------------------
    log(5, `→ Resolving target: ${targetUrl}`)

    const context: BrowserContext = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; InvariantScanner/1.0; +https://invariant.sh)',
      ignoreHTTPSErrors: true, // we want to detect TLS issues ourselves
    })

    const page: Page = await context.newPage()

    // Collect JS resource URLs so we can check for exposed source maps later
    const scriptUrls: string[] = []
    page.on('response', (res: PwResponse) => {
      const ct = res.headers()['content-type'] ?? ''
      if (ct.includes('javascript') && res.url().startsWith('http')) {
        scriptUrls.push(res.url())
      }
    })

    let mainResponse: PwResponse | null = null
    try {
      mainResponse = await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      })
      // Give JS a moment to run (SPA hydration, localStorage writes, etc.)
      await sleep(1_500)
    } catch (err) {
      emit(
        {
          progress: 100,
          message: `✕ Could not reach ${targetUrl}: ${(err as Error).message}`,
        },
        'complete',
      )
      return findings
    }

    if (!mainResponse) {
      emit({ progress: 100, message: '✕ No response from target.' }, 'complete')
      return findings
    }

    const finalUrl = page.url()
    const status = mainResponse.status()
    const responseHeaders = mainResponse.headers()

    log(12, `→ Connected: HTTP ${status} · ${finalUrl}`)
    await sleep(200)

    // -----------------------------------------------------------------------
    // HTTPS / TLS
    // -----------------------------------------------------------------------
    if (!finalUrl.startsWith('https://')) {
      log(14, '  • ⚠ Site is NOT served over HTTPS')
      report(14, {
        title: 'Site not served over HTTPS',
        severity: 'CRITICAL',
        category: 'Transport Security',
        description:
          'The application is served over plain HTTP. All traffic between the browser and your server — session tokens, form submissions, API responses — is transmitted in cleartext and visible to any network observer, including ISPs, Wi-Fi operators, and anyone performing a man-in-the-middle attack.',
        evidence: `Final URL after navigation: ${finalUrl}\nProtocol: HTTP (unencrypted)`,
        remediation:
          "Obtain a TLS certificate (free via Let's Encrypt) and configure your web server to redirect all HTTP traffic to HTTPS. Once stable, add: Strict-Transport-Security: max-age=31536000; includeSubDomains",
      })
    } else {
      log(14, '→ TLS: HTTPS confirmed')
    }
    await sleep(200)

    // HTTP → HTTPS redirect check (only if we targeted HTTPS)
    if (targetUrl.startsWith('https://')) {
      const httpUrl = targetUrl.replace(/^https:\/\//, 'http://')
      log(16, `→ Testing HTTP → HTTPS redirect (${httpUrl})`)
      try {
        const httpCtx = await browser.newContext({ ignoreHTTPSErrors: true })
        const httpPage = await httpCtx.newPage()
        await httpPage.goto(httpUrl, { waitUntil: 'domcontentloaded', timeout: 10_000 })
        const redirected = httpPage.url()
        await httpCtx.close()
        if (!redirected.startsWith('https://')) {
          report(17, {
            title: 'HTTP requests not automatically redirected to HTTPS',
            severity: 'HIGH',
            category: 'Transport Security',
            description:
              'The server does not redirect plain HTTP requests to HTTPS. A user who types the domain without a protocol, or clicks an old http:// link, will communicate in cleartext without any warning.',
            evidence: `GET ${httpUrl}\nFinal URL: ${redirected}\n↳ No redirect to HTTPS was performed.`,
            remediation:
              'Add a server-side 301 redirect from all HTTP traffic to the HTTPS equivalent. In Nginx: return 301 https://$host$request_uri;',
          })
        } else {
          log(17, '  • HTTP → HTTPS redirect: OK')
        }
      } catch {
        log(17, '  • HTTP → HTTPS redirect: could not test (connection refused on port 80)')
      }
    }

    // -----------------------------------------------------------------------
    // Phase 2 — Crawl & surface mapping
    // -----------------------------------------------------------------------
    log(20, '→ Crawling public surface…')
    await sleep(300)

    const [linkCount, formCount, inputCount] = await Promise.all([
      page.$$eval('a[href]', (els) =>
        [...new Set(
          (els as HTMLAnchorElement[])
            .map((e) => e.href)
            .filter((h) => h && !h.startsWith('javascript'))
        )].length
      ),
      page.$$eval('form', (f) => f.length),
      page.$$eval('input', (i) => i.length),
    ])

    log(24, `  • Discovered ${linkCount} unique links`)
    log(26, `  • Discovered ${formCount} form${formCount !== 1 ? 's' : ''}, ${inputCount} input field${inputCount !== 1 ? 's' : ''}`)
    await sleep(400)

    // -----------------------------------------------------------------------
    // Phase 3 — Security headers
    // -----------------------------------------------------------------------
    log(30, '→ Analysing HTTP security headers…')
    await sleep(300)

    // Content-Security-Policy
    if (!responseHeaders['content-security-policy']) {
      report(33, {
        title: 'Missing Content-Security-Policy header',
        severity: 'MEDIUM',
        category: 'Security Headers',
        description:
          'No Content-Security-Policy (CSP) header is present. CSP is the primary browser-enforced defence against cross-site scripting (XSS). Without it, an injected script runs with full access to the page, its storage, and any credentials held in memory.',
        evidence: `GET ${finalUrl}\nContent-Security-Policy: (absent)`,
        remediation:
          "Add a strict CSP. Start in report-only mode to find violations: Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'. Enforce once clean.",
      })
    } else {
      log(33, `  • Content-Security-Policy: present`)
    }

    // Strict-Transport-Security
    if (finalUrl.startsWith('https://') && !responseHeaders['strict-transport-security']) {
      report(35, {
        title: 'Missing Strict-Transport-Security (HSTS) header',
        severity: 'MEDIUM',
        category: 'Security Headers',
        description:
          "HSTS is missing. Without it, browsers will happily connect over HTTP even after seeing the site over HTTPS. An attacker can use SSL-stripping to silently downgrade connections — the user sees nothing wrong, but their traffic is cleartext.",
        evidence: `GET ${finalUrl}\nStrict-Transport-Security: (absent)`,
        remediation:
          'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains. Start with a short max-age (e.g. 300) to test, then increase to 31536000 once confident.',
      })
    } else if (responseHeaders['strict-transport-security']) {
      log(35, `  • Strict-Transport-Security: ${responseHeaders['strict-transport-security']}`)
    }

    // X-Frame-Options / frame-ancestors
    const hasFrameProtection =
      responseHeaders['x-frame-options'] ||
      (responseHeaders['content-security-policy'] ?? '').includes('frame-ancestors')
    if (!hasFrameProtection) {
      report(37, {
        title: 'Missing clickjacking protection (X-Frame-Options)',
        severity: 'LOW',
        category: 'Security Headers',
        description:
          'No X-Frame-Options or CSP frame-ancestors directive is set. The page can be embedded in an invisible iframe on an attacker-controlled site and used to trick authenticated users into performing actions without their knowledge (clickjacking).',
        evidence: `GET ${finalUrl}\nX-Frame-Options: (absent)\nCSP frame-ancestors: (absent)`,
        remediation:
          "Add X-Frame-Options: DENY (or SAMEORIGIN if you need to iframe your own pages), or set frame-ancestors 'none' in your Content-Security-Policy.",
      })
    } else {
      log(37, `  • Clickjacking protection: present`)
    }

    // X-Content-Type-Options
    if (!responseHeaders['x-content-type-options']) {
      report(38, {
        title: 'Missing X-Content-Type-Options header',
        severity: 'LOW',
        category: 'Security Headers',
        description:
          "Without X-Content-Type-Options: nosniff, older browsers may MIME-sniff a response and execute it as a different content type. For example, an uploaded image containing JavaScript could be executed as a script.",
        evidence: `GET ${finalUrl}\nX-Content-Type-Options: (absent)`,
        remediation: 'Add: X-Content-Type-Options: nosniff',
      })
    }

    // Server / X-Powered-By disclosure
    const serverVal = responseHeaders['server'] ?? ''
    const poweredVal = responseHeaders['x-powered-by'] ?? ''
    if (serverVal || poweredVal) {
      const disclosed: string[] = []
      if (serverVal) disclosed.push(`Server: ${serverVal}`)
      if (poweredVal) disclosed.push(`X-Powered-By: ${poweredVal}`)
      report(40, {
        title: 'Server technology disclosed in response headers',
        severity: 'LOW',
        category: 'Information Disclosure',
        description:
          'HTTP response headers reveal the server software and version. Attackers use this to immediately search CVE databases for known vulnerabilities in the exact version you are running.',
        evidence: `GET ${finalUrl}\n${disclosed.join('\n')}`,
        remediation:
          "Remove or override the Server and X-Powered-By headers at the web server / reverse proxy level. In Express: app.disable('x-powered-by'). In Nginx: server_tokens off.",
      })
    } else {
      log(40, '  • Server header disclosure: none detected')
    }

    // -----------------------------------------------------------------------
    // Phase 4 — Cookie security
    // -----------------------------------------------------------------------
    log(45, '→ Inspecting cookie security attributes…')
    await sleep(400)

    const allCookies = await context.cookies()
    const authCookies = allCookies.filter((c) =>
      /session|auth|token|jwt|sid|user|login|remember/i.test(c.name)
    )
    const insecureCookies = authCookies.filter(
      (c) => !c.httpOnly || !c.secure || !c.sameSite || c.sameSite === 'None'
    )

    if (insecureCookies.length > 0) {
      const evidenceLines = insecureCookies.map((c) => {
        const missing: string[] = []
        if (!c.httpOnly) missing.push('HttpOnly')
        if (!c.secure) missing.push('Secure')
        if (!c.sameSite || c.sameSite === 'None') missing.push('SameSite')
        return `${c.name}: missing [${missing.join(', ')}]`
      })
      report(52, {
        title: 'Authentication cookies missing security attributes',
        severity: 'HIGH',
        category: 'Cookie Security',
        description:
          'One or more authentication cookies lack the HttpOnly, Secure, or SameSite attributes. Missing HttpOnly means JavaScript can read the cookie — any XSS vulnerability becomes an automatic session hijack. Missing Secure means the cookie is sent over HTTP. Missing SameSite enables CSRF attacks.',
        evidence: [
          `Cookies on ${new URL(finalUrl).hostname}:`,
          ...evidenceLines,
        ].join('\n'),
        remediation:
          'Set all authentication cookies with: HttpOnly; Secure; SameSite=Strict (or Lax if cross-site POSTs are needed). In Express/Node: res.cookie("session", value, { httpOnly: true, secure: true, sameSite: "strict" })',
      })
    } else if (authCookies.length > 0) {
      log(52, `  • ${authCookies.length} auth cookie(s) — attributes look correct`)
    } else {
      log(52, '  • No session cookies detected on the public surface')
    }

    // -----------------------------------------------------------------------
    // Phase 5 — localStorage / sessionStorage inspection
    // -----------------------------------------------------------------------
    log(58, '→ Auditing client-side storage for credentials…')
    await sleep(300)
    log(60, '  • Executing in-browser localStorage enumeration')
    await sleep(500)

    const [localItems, sessionItems] = await page.evaluate(() => {
      function dump(store: Storage): [string, string][] {
        const out: [string, string][] = []
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i)
          if (k) out.push([k, store.getItem(k) ?? ''])
        }
        return out
      }
      return [dump(localStorage), dump(sessionStorage)]
    })

    const sensitiveLocal = localItems.filter(
      ([k, v]) => TOKEN_KEY.test(k) || JWT_VALUE.test(v)
    )
    const sensitiveSession = sessionItems.filter(
      ([k, v]) => TOKEN_KEY.test(k) || JWT_VALUE.test(v)
    )
    const allSensitive = [...sensitiveLocal, ...sensitiveSession]

    if (allSensitive.length > 0) {
      const evidenceLines = allSensitive.map(([k, v]) => {
        const isJwt = JWT_VALUE.test(v)
        const display = isJwt ? `${v.slice(0, 20)}…[JWT]` : truncate(v)
        const store = sensitiveLocal.some(([lk]) => lk === k) ? 'localStorage' : 'sessionStorage'
        return `${store}["${k}"] = "${display}"`
      })
      report(68, {
        title: 'Auth tokens stored in localStorage / sessionStorage',
        severity: 'HIGH',
        category: 'Insecure Storage',
        description:
          'Authentication tokens were found in localStorage or sessionStorage. Both are readable by any JavaScript on the same origin — including third-party analytics scripts, browser extensions, and any XSS payload. An attacker who achieves even reflected XSS can exfiltrate every stored token with a single fetch() and replay it from any device, indefinitely.',
        evidence: [
          `[In-browser probe — ${new URL(finalUrl).hostname}]`,
          ...evidenceLines,
          `↳ ${allSensitive.length} sensitive item${allSensitive.length !== 1 ? 's' : ''} found in client-side storage.`,
        ].join('\n'),
        remediation:
          'Store session tokens exclusively in HttpOnly, Secure, SameSite=Strict cookies. HttpOnly makes the value completely inaccessible to JavaScript — even a full XSS cannot steal it. If you use JWTs, issue short-lived access tokens (≤15 min) via cookie and implement a silent refresh endpoint. Remove all token writes to localStorage/sessionStorage.',
      })
    } else {
      log(68, '  • No auth tokens found in localStorage or sessionStorage')
    }

    // -----------------------------------------------------------------------
    // Phase 6 — Source map exposure
    // -----------------------------------------------------------------------
    log(72, '→ Checking for exposed JavaScript source maps…')
    await sleep(300)

    let mapFound = false
    const checkedMaps: string[] = []

    for (const url of scriptUrls.slice(0, 6)) {
      const mapUrl = url.endsWith('.js') ? url + '.map' : url.replace(/(\?.*)?$/, '.map')
      try {
        const res = await page.request.get(mapUrl, { timeout: 5_000 })
        if (res.ok()) {
          const size = (await res.body()).length
          checkedMaps.push(`GET ${mapUrl} → ${res.status()} OK (${Math.round(size / 1024)} KB)`)
          mapFound = true
          break
        }
      } catch {
        // unreachable map is fine
      }
    }

    if (mapFound) {
      report(78, {
        title: 'JavaScript source maps publicly accessible',
        severity: 'LOW',
        category: 'Information Disclosure',
        description:
          'Production JavaScript source maps are accessible without authentication. Source maps reconstruct your original, unminified source code — including comments, variable names, business logic, and any hardcoded values that were not moved to environment variables.',
        evidence: checkedMaps.join('\n'),
        remediation:
          'Disable source map generation in your production build (sourcemaps: false in webpack/vite/esbuild). If you need maps for error tracking, upload them to Sentry or a similar service and exclude them from the public bundle. Never ship .map files to production.',
      })
    } else {
      log(78, '  • No exposed source maps detected')
    }

    // -----------------------------------------------------------------------
    // Phase 7 — Sensitive file exposure
    // -----------------------------------------------------------------------
    log(82, '→ Probing for common sensitive file exposure…')
    await sleep(300)

    const sensitiveProbes = [
      '/.env',
      '/.env.local',
      '/.git/config',
      '/config.json',
      '/api/debug',
    ]
    const exposedFiles: string[] = []

    for (const path of sensitiveProbes) {
      try {
        const probeUrl = new URL(path, finalUrl).toString()
        const res = await page.request.get(probeUrl, { timeout: 5_000 })
        if (res.ok()) {
          const body = await res.text()
          // A 200 from a catch-all route (e.g. Next.js, SPAs) returns the app
          // shell, not the file itself. Only flag if the body actually looks
          // like a real sensitive file — not HTML.
          const looksLikeHtml = /^\s*<!doctype\s+html|^\s*<html/i.test(body)
          if (looksLikeHtml) continue
          const preview = body.slice(0, 120)
          exposedFiles.push(`GET ${probeUrl} → ${res.status()} OK\n  preview: ${preview}`)
        }
      } catch {
        // blocked/404 is expected and fine
      }
    }

    if (exposedFiles.length > 0) {
      report(88, {
        title: 'Sensitive files publicly accessible',
        severity: 'CRITICAL',
        category: 'Information Disclosure',
        description:
          'One or more sensitive files are accessible without authentication. These files may contain environment variables, API keys, database credentials, or internal configuration that gives an attacker full access to your backend infrastructure.',
        evidence: exposedFiles.join('\n\n'),
        remediation:
          'Block access to these paths at the web server level and ensure they are not deployed to the public root. Add .env, .git, and config files to your .dockerignore and deployment exclusion lists.',
      })
    } else {
      log(88, '  • No sensitive files exposed')
    }

    await context.close()

    // -----------------------------------------------------------------------
    // Done
    // -----------------------------------------------------------------------
    log(95, '→ Generating final report…')
    await sleep(600)

  } finally {
    await browser.close()
  }

  return findings
}
