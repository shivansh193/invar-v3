import type { BrowserContext, Page } from 'playwright-core'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ScanFinding } from './scanner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentFinding {
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  category: string
  description: string
  evidence: string
  remediation: string
}

interface AgentResponse {
  action: 'click' | 'navigate' | 'fill' | 'submit' | 'observe' | 'done'
  target: string | null
  value: string | null
  reasoning: string
  finding: AgentFinding | null
}

interface ActionRecord {
  action: string
  target: string | null
  reasoning: string
}

export type AuthEmit = (message: string, finding?: ScanFinding) => void

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEPTH_LIMITS: Record<string, number> = {
  quick: 15,
  shallow: 30,
  standard: 60,
  deep: 120,
}

const ADMIN_PATHS = [
  '/admin',
  '/admin/users',
  '/admin/dashboard',
  '/api/admin',
  '/api/users',
  '/api/v1/admin',
]

const SYSTEM_PROMPT =
  'You are performing an authorized security assessment of a web application. ' +
  'You are authenticated as a real user. You think like an experienced attacker — ' +
  'methodical and intelligent, not random. Your priorities in order are: finding ' +
  'insecure direct object references by modifying resource IDs, finding privilege ' +
  'escalation by accessing admin or higher-tier functionality, finding business ' +
  'logic flaws in multi-step flows, and finding session handling issues. You never ' +
  'perform destructive actions. You respond only in valid JSON.'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function preprocessHtml(html: string): string {
  let out = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  if (out.length > 15_000) out = out.slice(0, 15_000) + '…[truncated]'
  return out
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fence ? fence[1].trim() : text.trim()
}

function parseAgentResponse(text: string): AgentResponse | null {
  try {
    return JSON.parse(extractJson(text)) as AgentResponse
  } catch {
    return null
  }
}

function toScanFinding(f: AgentFinding): ScanFinding {
  return {
    title: f.title,
    severity: f.severity === 'INFO' ? 'LOW' : f.severity,
    category: f.category,
    description: f.description,
    evidence: f.evidence,
    remediation: f.remediation,
  }
}

// Generate IDOR probe URLs from a resource URL containing a numeric ID.
function generateIdorProbes(url: string): string[] {
  const probes: string[] = []

  const pathMatch = url.match(/\/(\d{2,19})(\/|$|\?|#)/)
  if (pathMatch) {
    const id = parseInt(pathMatch[1], 10)
    for (const candidate of [id + 1, id - 1, 1, 2]) {
      if (candidate > 0 && candidate !== id) {
        probes.push(url.replace(`/${pathMatch[1]}${pathMatch[2]}`, `/${candidate}${pathMatch[2]}`))
      }
    }
  }

  const queryMatch = url.match(/([?&])(id|user_id|userId|account_id|order_id|item_id)=(\d+)/i)
  if (queryMatch) {
    const id = parseInt(queryMatch[3], 10)
    for (const candidate of [id + 1, id - 1, 1, 2]) {
      if (candidate > 0 && candidate !== id) {
        probes.push(url.replace(queryMatch[0], `${queryMatch[1]}${queryMatch[2]}=${candidate}`))
      }
    }
  }

  return probes
}

const HAS_ID = /\/\d{2,19}(\/|$|\?|#)|[?&](id|user_id|userId|account_id|order_id|item_id)=\d+/i

// ---------------------------------------------------------------------------
// Main Phase 2 function
// ---------------------------------------------------------------------------

export async function runAuthenticatedScan(
  browser: import('playwright-core').Browser,
  targetUrl: string,
  credentials: { username: string; password: string },
  depth: string,
  emit: AuthEmit,
): Promise<ScanFinding[]> {
  if (!process.env.GEMINI_API_KEY) {
    emit('⚠ GEMINI_API_KEY not configured — skipping authenticated scan phase')
    return []
  }

  const findings: ScanFinding[] = []
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

  const report = (finding: ScanFinding) => {
    findings.push(finding)
    emit(`⚠ Found: ${finding.title}`, finding)
  }

  const maxTurns = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.standard

  // Keepalive — emit a heartbeat if nothing else has been sent in 7.5 s
  let lastEmitAt = Date.now()
  const tick = setInterval(() => {
    if (Date.now() - lastEmitAt >= 7_500) {
      emit('  • Exploring authenticated surface…')
      lastEmitAt = Date.now()
    }
  }, 2_000)

  const safeEmit = (msg: string, finding?: ScanFinding) => {
    emit(msg, finding)
    lastEmitAt = Date.now()
  }

  // Fresh context so Phase 2 starts without any Phase 1 cookies
  const context: BrowserContext = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; InvariantScanner/1.0; +https://invariant.sh)',
    ignoreHTTPSErrors: true,
  })
  const page: Page = await context.newPage()

  try {
    // ── Login ──────────────────────────────────────────────────────────────────
    safeEmit(`→ Logging in as ${credentials.username}…`)

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await page.waitForTimeout(800)

    const loginHtml = preprocessHtml(await page.content())

    // Ask Gemini to identify the login form selectors
    let usernameSelector = 'input[type="email"], input[name="email"], input[name="username"], input[type="text"]'
    let passwordSelector = 'input[type="password"]'
    let submitSelector = 'button[type="submit"], input[type="submit"]'

    try {
      const selectorResult = await model.generateContent(
        `The following is the HTML of a page. Identify the CSS selector for the username/email input, ` +
        `the password input, and the submit button. If the page is not a login page return null for all. ` +
        `Return ONLY valid JSON in exactly this format, nothing else:\n` +
        `{"usernameSelector":"...","passwordSelector":"...","submitSelector":"..."}\n\nHTML:\n${loginHtml}`,
      )
      const parsed = JSON.parse(extractJson(selectorResult.response.text()))
      if (parsed.usernameSelector) usernameSelector = parsed.usernameSelector
      if (parsed.passwordSelector) passwordSelector = parsed.passwordSelector
      if (parsed.submitSelector) submitSelector = parsed.submitSelector
    } catch {
      // fall through to defaults
    }

    // Fill and submit
    try {
      await page.fill(usernameSelector, credentials.username)
      await page.fill(passwordSelector, credentials.password)
      await Promise.all([
        page.waitForNavigation({ timeout: 10_000 }).catch(() => {}),
        page.click(submitSelector),
      ])
    } catch {
      // Fallback: try enter key
      try {
        await page.fill('input[type="email"], input[name="email"], input[name="username"]', credentials.username)
        await page.fill('input[type="password"]', credentials.password)
        await Promise.all([
          page.waitForNavigation({ timeout: 10_000 }).catch(() => {}),
          page.keyboard.press('Enter'),
        ])
      } catch { /* ignore */ }
    }

    await page.waitForLoadState('domcontentloaded').catch(() => {})
    await page.waitForTimeout(800)

    const postLoginUrl = page.url()
    const postLoginHtml = preprocessHtml(await page.content())

    // Verify login
    let loginSucceeded = false
    try {
      const verifyResult = await model.generateContent(
        `After attempting login, the browser is at: ${postLoginUrl}\n\n` +
        `HTML preview:\n${postLoginHtml.slice(0, 4_000)}\n\n` +
        `Did the login succeed? Return ONLY valid JSON: {"success":true/false,"reason":"one sentence"}`,
      )
      const v = JSON.parse(extractJson(verifyResult.response.text()))
      loginSucceeded = v.success === true
    } catch {
      // Heuristic: URL changed away from login page
      loginSucceeded =
        postLoginUrl !== targetUrl &&
        !/login|signin|sign-in|auth/i.test(postLoginUrl)
    }

    if (!loginSucceeded) {
      report({
        title: 'Authenticated scan failed — could not log in',
        severity: 'HIGH',
        category: 'Authentication',
        description:
          'The scanner could not log in with the provided credentials. The authenticated scan phase was skipped.',
        evidence:
          `Target: ${targetUrl}\nPost-login URL: ${postLoginUrl}\n` +
          `Credentials used: ${credentials.username} / [redacted]`,
        remediation:
          'Verify the test account credentials are correct and the account is active. ' +
          'Ensure the login form is accessible at the target URL.',
      })
      return findings
    }

    safeEmit('→ Login confirmed — beginning authenticated exploration')

    // ── Post-login cookie check ────────────────────────────────────────────────
    const postLoginCookies = await context.cookies()
    const authCookies = postLoginCookies.filter(c =>
      /session|auth|token|jwt|sid|user|login|remember/i.test(c.name),
    )
    const insecureCookies = authCookies.filter(
      c => !c.httpOnly || !c.secure || !c.sameSite || c.sameSite === 'None',
    )
    if (insecureCookies.length > 0) {
      const lines = insecureCookies.map(c => {
        const missing: string[] = []
        if (!c.httpOnly) missing.push('HttpOnly')
        if (!c.secure) missing.push('Secure')
        if (!c.sameSite || c.sameSite === 'None') missing.push('SameSite')
        return `${c.name}: missing [${missing.join(', ')}]`
      })
      report({
        title: 'Authentication cookies missing security attributes (post-login)',
        severity: 'HIGH',
        category: 'Cookie Security',
        description:
          'After login, one or more authentication cookies are missing HttpOnly, Secure, or SameSite ' +
          'attributes. These cookies now carry real session tokens.',
        evidence: ['Post-login auth cookies:', ...lines].join('\n'),
        remediation:
          'Set all session cookies with: HttpOnly; Secure; SameSite=Strict (or Lax if needed).',
      })
    }

    // Capture auth token for session invalidation test later
    const authTokenCookie = postLoginCookies.find(c =>
      /session|auth|token|jwt/i.test(c.name),
    )

    // ── Admin endpoint probes ──────────────────────────────────────────────────
    safeEmit('→ Probing admin endpoints…')

    for (const adminPath of ADMIN_PATHS) {
      const adminUrl = new URL(adminPath, targetUrl).toString()
      try {
        const res = await page.request.get(adminUrl, { timeout: 6_000 })
        const status = res.status()
        if (status < 300 && status !== 404) {
          const body = await res.text()
          const isLoginRedirect = /login|signin|sign.in|unauthorized|forbidden/i.test(body.slice(0, 600))
          if (!isLoginRedirect) {
            report({
              title: `Admin endpoint accessible to regular user: ${adminPath}`,
              severity: adminPath.includes('users') || adminPath === '/admin' ? 'CRITICAL' : 'HIGH',
              category: 'Access Control',
              description:
                `The endpoint ${adminPath} returned HTTP ${status} to an authenticated non-admin user. ` +
                'This may expose administrative functionality or sensitive data to unprivileged accounts.',
              evidence: `GET ${adminUrl} → ${status}\nResponse preview: ${body.slice(0, 400)}`,
              remediation:
                'Implement role-based access control on all admin endpoints. Check the current ' +
                "user's role server-side on every request before returning any privileged data.",
            })
          }
        }
      } catch { /* 404 / network error is expected */ }
    }

    // ── Reasoning loop ─────────────────────────────────────────────────────────
    const visitedUrls = new Set<string>([postLoginUrl])
    const resourceUrls: string[] = []
    const actionHistory: ActionRecord[] = []

    for (let turn = 0; turn < maxTurns; turn++) {
      const currentUrl = page.url()

      if (HAS_ID.test(currentUrl) && !resourceUrls.includes(currentUrl)) {
        resourceUrls.push(currentUrl)
      }

      let currentHtml = ''
      try {
        currentHtml = preprocessHtml(await page.content())
      } catch {
        currentHtml = '[could not capture page HTML]'
      }

      // Check if auth token appears in any visited URL (session token in URL)
      if (authTokenCookie && currentUrl.includes(authTokenCookie.value.slice(0, 8))) {
        report({
          title: 'Session token exposed in URL',
          severity: 'HIGH',
          category: 'Authentication',
          description:
            'The authentication session token appears as a URL parameter. Tokens in URLs are ' +
            'logged by servers, proxies, and browser history — any party with access to logs ' +
            'can hijack the session.',
          evidence: `URL containing token: ${currentUrl}`,
          remediation:
            'Transmit session tokens exclusively via HttpOnly cookies, never in URLs or query strings.',
        })
      }

      const turnContext = JSON.stringify({
        currentUrl,
        pageHtml: currentHtml,
        recentActions: actionHistory.slice(-15),
        findingsSoFar: findings.map(f => ({ title: f.title, severity: f.severity })),
        visitedUrls: [...visitedUrls].slice(-50),
      })

      let response: AgentResponse | null = null
      try {
        const result = await model.generateContent(turnContext)
        response = parseAgentResponse(result.response.text())
      } catch {
        continue
      }

      if (!response) continue

      if (response.finding) {
        report(toScanFinding(response.finding))
      }

      actionHistory.push({
        action: response.action,
        target: response.target,
        reasoning: response.reasoning,
      })

      safeEmit(`  • [${turn + 1}/${maxTurns}] ${response.action}: ${response.reasoning}`)

      if (response.action === 'done') break

      // Execute the action
      try {
        switch (response.action) {
          case 'navigate': {
            if (response.target) {
              const navUrl = response.target.startsWith('http')
                ? response.target
                : new URL(response.target, currentUrl).toString()
              if (!visitedUrls.has(navUrl)) {
                visitedUrls.add(navUrl)
                await page.goto(navUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 })
                await page.waitForTimeout(400)
              }
            }
            break
          }
          case 'click': {
            if (response.target) {
              await page.click(response.target, { timeout: 5_000 })
              await page.waitForLoadState('domcontentloaded').catch(() => {})
              visitedUrls.add(page.url())
            }
            break
          }
          case 'fill': {
            if (response.target && response.value !== null) {
              await page.fill(response.target, response.value ?? '', { timeout: 5_000 })
            }
            break
          }
          case 'submit': {
            if (response.target) {
              await Promise.all([
                page.waitForNavigation({ timeout: 10_000 }).catch(() => {}),
                page.click(response.target, { timeout: 5_000 }),
              ])
              visitedUrls.add(page.url())
            }
            break
          }
          case 'observe':
            break
        }
      } catch { /* skip failed actions */ }
    }

    // ── IDOR testing ───────────────────────────────────────────────────────────
    if (resourceUrls.length > 0) {
      safeEmit(`→ Testing IDOR on ${resourceUrls.length} resource URL(s)…`)

      outer: for (const resourceUrl of resourceUrls.slice(0, 10)) {
        const probes = generateIdorProbes(resourceUrl)
        for (const probeUrl of probes) {
          safeEmit(`  • Testing IDOR on ${probeUrl}…`)
          try {
            const res = await page.request.get(probeUrl, { timeout: 8_000 })
            if (!res.ok()) continue
            const body = await res.text()
            const isHtml = /^\s*<!doctype\s+html|^\s*<html/i.test(body)
            const is404 = /not found|404|no longer|doesn.t exist/i.test(body.slice(0, 600))
            const isDenied = /forbidden|unauthorized|access denied|not allowed/i.test(body.slice(0, 600))
            if (!is404 && !isDenied && body.length > 100) {
              // For API responses (JSON) or HTML with data, flag it
              const looksLikeData = !isHtml || /"(id|email|user|name)"/.test(body)
              if (looksLikeData) {
                report({
                  title: 'Potential Insecure Direct Object Reference (IDOR)',
                  severity: 'CRITICAL',
                  category: 'Access Control',
                  description:
                    'The application returned data for a resource ID that the current user ' +
                    "should not have access to. An attacker can enumerate other users' data " +
                    'by incrementing or guessing IDs in the URL.',
                  evidence:
                    `Original URL: ${resourceUrl}\n` +
                    `Modified URL: ${probeUrl}\n` +
                    `Status: ${res.status()}\n` +
                    `Response preview: ${body.slice(0, 400)}`,
                  remediation:
                    'Validate server-side that the authenticated user owns or has explicit ' +
                    'permission to access each requested resource. Never rely on IDs alone.',
                })
                continue outer // one finding per resource URL
              }
            }
          } catch { /* connection errors are expected */ }
        }
      }
    }

    // ── Session invalidation test ──────────────────────────────────────────────
    if (authTokenCookie) {
      try {
        // Look for a logout endpoint
        let loggedOut = false

        // Try common logout paths
        for (const logoutPath of ['/logout', '/signout', '/api/auth/signout', '/auth/logout', '/sign-out']) {
          try {
            const logoutUrl = new URL(logoutPath, targetUrl).toString()
            await page.goto(logoutUrl, { waitUntil: 'domcontentloaded', timeout: 6_000 })
            if (!/login|signin|sign.in/i.test(page.url()) === false) {
              loggedOut = true
              break
            }
            const postHtml = await page.content()
            if (/logged out|signed out|goodbye|see you/i.test(postHtml.slice(0, 1_000))) {
              loggedOut = true
              break
            }
          } catch { /* continue */ }
        }

        if (!loggedOut) {
          // Try clicking a logout button via Gemini
          try {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10_000 })
            const pageHtml = preprocessHtml(await page.content())
            const logoutResult = await model.generateContent(
              `Find the logout button or link CSS selector in this HTML. ` +
              `Return ONLY valid JSON: {"selector":"...css..." } or {"selector":null}\n\nHTML:\n${pageHtml.slice(0, 5_000)}`,
            )
            const logoutData = JSON.parse(extractJson(logoutResult.response.text()))
            if (logoutData.selector) {
              await page.click(logoutData.selector, { timeout: 5_000 })
              await page.waitForLoadState('domcontentloaded').catch(() => {})
              loggedOut = true
            }
          } catch { /* skip */ }
        }

        if (loggedOut) {
          // Attempt to replay old session token in a new context
          const testCtx = await browser.newContext({ ignoreHTTPSErrors: true })
          try {
            await testCtx.addCookies([{
              ...authTokenCookie,
              domain: new URL(targetUrl).hostname,
            }])
            const testPage = await testCtx.newPage()
            const protectedUrl = resourceUrls[0] ?? new URL('/api/me', targetUrl).toString()
            const res = await testPage.request.get(protectedUrl, { timeout: 6_000 })
            if (res.ok()) {
              const body = await res.text()
              const isLoginPage = /login|signin|please log in/i.test(body.slice(0, 600))
              if (!isLoginPage) {
                report({
                  title: 'Session not invalidated after logout',
                  severity: 'HIGH',
                  category: 'Authentication',
                  description:
                    'After logging out, the original session token still grants access to ' +
                    'authenticated resources. An attacker who captures a session token can ' +
                    'maintain access even after the victim logs out.',
                  evidence:
                    `Cookie replayed: ${authTokenCookie.name}=${authTokenCookie.value.slice(0, 20)}…\n` +
                    `Request to: ${protectedUrl}\n` +
                    `Status: ${res.status()} (expected 401 or 403 after logout)`,
                  remediation:
                    'Invalidate session tokens server-side on logout. Maintain a server-side ' +
                    'session store and verify token validity on every authenticated request.',
                })
              }
            }
          } finally {
            await testCtx.close()
          }
        }
      } catch { /* session test is best-effort */ }
    }
  } finally {
    clearInterval(tick)
    await context.close().catch(() => {})
  }

  return findings
}

// ---------------------------------------------------------------------------
// Executive summary
// ---------------------------------------------------------------------------

export async function generateExecutiveSummary(
  targetUrl: string,
  findings: ScanFinding[],
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return ''
  try {
    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const list = findings.length > 0
      ? findings.map(f => `- [${f.severity}] ${f.title}`).join('\n')
      : 'No findings.'
    const result = await model.generateContent(
      'Write a 2-3 sentence executive summary of this security scan for a non-technical founder ' +
      'who may need to share it with an enterprise prospect or auditor. Name the most serious finding ' +
      'in plain English. State the overall risk level. End with one sentence on what to fix first. ' +
      'If there are no findings, frame the clean result as a positive — the application passed this assessment.\n\n' +
      `Target: ${targetUrl}\nFindings:\n${list}`,
    )
    return result.response.text().trim()
  } catch {
    return ''
  }
}
