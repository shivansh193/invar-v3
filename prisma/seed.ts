import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('demo', 12)
  const demo = await prisma.user.upsert({
    where: { email: 'demo@invariant.sh' },
    update: { plan: 'enterprise' },
    create: {
      email: 'demo@invariant.sh',
      name: 'Demo User',
      password: hash,
      plan: 'enterprise',
    },
  })
  console.log('Seeded demo user: demo@invariant.sh / demo (plan: enterprise)')

  // Seed demo scans so the dashboard has data on first login
  const scan1 = await prisma.scan.upsert({
    where: { id: 'demo-scan-1' },
    update: {},
    create: {
      id: 'demo-scan-1',
      userId: demo.id,
      url: 'https://app.usemosaic.com',
      status: 'complete',
      mode: 'authenticated',
      depth: 'standard',
      createdAt: new Date('2026-05-06T14:02:00Z'),
      completedAt: new Date('2026-05-06T14:09:22Z'),
    },
  })

  const scan2 = await prisma.scan.upsert({
    where: { id: 'demo-scan-2' },
    update: {},
    create: {
      id: 'demo-scan-2',
      userId: demo.id,
      url: 'https://app.usemosaic.com',
      status: 'complete',
      mode: 'authenticated',
      depth: 'standard',
      createdAt: new Date('2026-04-22T09:18:00Z'),
      completedAt: new Date('2026-04-22T09:26:10Z'),
    },
  })

  const scan3 = await prisma.scan.upsert({
    where: { id: 'demo-scan-3' },
    update: {},
    create: {
      id: 'demo-scan-3',
      userId: demo.id,
      url: 'https://staging.usemosaic.com',
      status: 'complete',
      mode: 'unauthenticated',
      depth: 'standard',
      createdAt: new Date('2026-04-14T16:44:00Z'),
      completedAt: new Date('2026-04-14T16:51:08Z'),
    },
  })

  // Seed findings for scan 1
  const scan1Findings = [
    {
      id: 'demo-f-1-1',
      scanId: scan1.id,
      title: 'Insecure Direct Object Reference in user profile endpoint',
      severity: 'CRITICAL',
      category: 'Access Control',
      description: "Any logged-in user can view any other user's profile data — including email address, billing information, and account history — by changing the numeric ID in the request URL. There is no authorization check that confirms the requester is the owner of the data being requested.\n\nThis is the type of finding that causes enterprise prospects to pause a deal or require remediation before signing. It also creates direct regulatory exposure under GDPR and CCPA.",
      evidence: `[10:42:17] Logged in as test user (id: 1047)\n[10:42:18] GET /api/users/1047/profile  →  200 OK\n[10:42:19] Modified request: GET /api/users/1048/profile\n[10:42:19] Response: 200 OK   ⚠ access granted to other user\n            ↳ exposed: email, full_name, billing_address,\n              subscription_tier, last_login_ip\n[10:42:21] Confirmed across 12/12 sampled user IDs.`,
      remediation: 'Add an authorization check before returning user data. Verify that the authenticated session user ID matches the requested resource ID — or that the user has admin role. The check belongs in the controller, before the database query runs.',
    },
    {
      id: 'demo-f-1-2',
      scanId: scan1.id,
      title: 'Session tokens not invalidated after password change',
      severity: 'CRITICAL',
      category: 'Authentication',
      description: "When a user changes their password, the old session tokens issued before the change are not revoked. An attacker who stole a session cookie before the password change still has full access to the account afterward — defeating the purpose of changing the password.\n\nPassword rotation is the standard response to a suspected account compromise. If old tokens stay live, the user has no way to lock an attacker out without contacting support.",
      evidence: `[11:08:02] Authenticated as user 1047, captured session_token_A\n[11:08:14] Changed password via /api/account/password\n[11:08:15] Response: 200 OK\n[11:08:18] Replayed session_token_A on /api/me\n[11:08:18] Response: 200 OK   ⚠ stale token still accepted\n            ↳ token was valid for 47 minutes after password change`,
      remediation: 'On a successful password change, invalidate every session token associated with that user except the one that initiated the change. If you store sessions in Redis, delete the keys; if they\'re JWTs, increment a per-user token version claim and reject older versions.',
    },
    {
      id: 'demo-f-1-3',
      scanId: scan1.id,
      title: 'Workspace owner can be deleted by any member',
      severity: 'HIGH',
      category: 'Access Control',
      description: "The endpoint that removes a member from a workspace does not check the role of the target. A regular member can call it with the owner's ID and successfully remove the owner — leaving a workspace with no owner, broken billing ownership, and orphaned admin permissions.",
      evidence: `[12:14:33] Authenticated as member (role=member)\n[12:14:34] DELETE /api/workspace/42/members/owner_id\n[12:14:34] Response: 204 No Content   ⚠ owner removed\n[12:14:36] GET /api/workspace/42  →  200 OK\n            ↳ workspace.owner_id = null`,
      remediation: 'Add a role check on the member-removal endpoint. Only owners and admins should be allowed to remove members, and removing the last owner should be explicitly forbidden.',
    },
    {
      id: 'demo-f-1-4',
      scanId: scan1.id,
      title: 'Verbose error messages expose database schema',
      severity: 'HIGH',
      category: 'Information Disclosure',
      description: "When the database raises an error, the API returns the raw exception message in the response body. This includes the SQL statement, table names, and column names of your internal schema. Schema disclosure dramatically reduces the work an attacker has to do.",
      evidence: `[13:44:51] GET /api/projects?sort=' OR 1=1 --\n[13:44:51] Response: 500 Internal Server Error\n            ↳ "syntax error at or near \"'\"\n              LINE 1: SELECT id, owner_id, secret_token, ...\n                      FROM projects WHERE deleted_at IS NULL\n                      ORDER BY ' OR 1=1 --"`,
      remediation: 'Catch database exceptions in your error-handling middleware and return a generic 500 response in production. Log the full exception server-side; never include the SQL or stack trace in the response body.',
    },
    {
      id: 'demo-f-1-5',
      scanId: scan1.id,
      title: 'No rate limit on login endpoint',
      severity: 'HIGH',
      category: 'Authentication',
      description: "There is no rate limit, lockout, or CAPTCHA on the login endpoint. A single IP can submit thousands of login attempts per minute, which makes credential-stuffing attacks against your users trivial. Credential stuffing is the single most common attack against SaaS products.",
      evidence: `[14:20:00] Submitted 5,000 login attempts in 60s from a single IP.\n[14:21:02] All 5,000 attempts received 401 Unauthorized.\n            ↳ no lockout, no CAPTCHA, no slow-down.\n            ↳ rate-limit headers absent from responses.`,
      remediation: 'Add a rate limit on POST /login: 10 attempts per IP per 15 minutes, and 5 attempts per email per 15 minutes. Lock the account temporarily after 10 failed attempts.',
    },
    {
      id: 'demo-f-1-5b',
      scanId: scan1.id,
      title: 'Auth tokens stored in localStorage',
      severity: 'HIGH',
      category: 'Insecure Storage',
      description: "Session tokens and authentication credentials are written to localStorage rather than HttpOnly cookies. localStorage is accessible to any JavaScript running on the page — including third-party scripts, browser extensions, and injected code from an XSS vulnerability. An attacker who achieves XSS can silently exfiltrate every token with a single line of code and replay it from any device.",
      evidence: `[In-browser probe on authenticated session]\n> localStorage.getItem("auth_token")\n"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMDQ3..."\n> localStorage.getItem("session")\n"sess_8f2a19c4d7..."\n↳ 2 authentication artefacts found in localStorage.\n↳ Both readable by document.cookie-inaccessible scripts.`,
      remediation: 'Store session tokens exclusively in HttpOnly, Secure, SameSite=Strict cookies. HttpOnly prevents any JavaScript from reading the cookie, so even a successful XSS cannot steal the token. If you use JWTs, issue them as short-lived access tokens (≤15 min) delivered via cookie, with a refresh flow that never touches localStorage.',
    },
    {
      id: 'demo-f-1-6',
      scanId: scan1.id,
      title: 'Server header reveals exact framework version',
      severity: 'MEDIUM',
      category: 'Information Disclosure',
      description: "Every response from your API includes a Server header that reveals the framework and minor version in use. Attackers use this to immediately match your stack against public CVE databases.",
      evidence: `[15:02:11] HEAD /api/health\n            Server: Express/4.18.2 (Node 18.7.0)\n            X-Powered-By: Express`,
      remediation: "Disable or override the Server and X-Powered-By headers in your reverse proxy or framework config. In Express: app.disable('x-powered-by').",
    },
    {
      id: 'demo-f-1-7',
      scanId: scan1.id,
      title: 'Cookies missing Secure and SameSite attributes',
      severity: 'MEDIUM',
      category: 'Configuration',
      description: "The session cookie does not have the Secure flag (so it can be sent over plain HTTP) and does not have a SameSite attribute (so it is included on cross-site requests). This combination enables both network interception and CSRF.",
      evidence: `[15:38:44] POST /api/login → Set-Cookie:\n            session=eyJhbGc...; Path=/; HttpOnly\n            ↳ missing: Secure, SameSite=Strict`,
      remediation: 'Set Secure, HttpOnly, and SameSite=Strict on every authentication cookie.',
    },
    {
      id: 'demo-f-1-8',
      scanId: scan1.id,
      title: 'API tokens never expire',
      severity: 'MEDIUM',
      category: 'Access Control',
      description: "API tokens issued from the user dashboard have no expiration date and no enforced rotation. A token leaked into a Slack message, a screenshot, or a public GitHub commit retains full access indefinitely.",
      evidence: `[16:01:08] Generated API token via dashboard\n[16:01:08] Inspected token claims: { exp: null }\n            ↳ token valid forever, no rotation policy.`,
      remediation: 'Set a default expiration of 90 days on issued tokens. Display token age and last-used timestamp prominently in the dashboard.',
    },
    {
      id: 'demo-f-1-9',
      scanId: scan1.id,
      title: 'Source maps exposed in production bundle',
      severity: 'LOW',
      category: 'Information Disclosure',
      description: "Your production build serves .map files alongside the bundled JavaScript. Anyone who opens browser dev tools can see your unminified frontend code, including comments and any hardcoded keys that haven't been moved server-side.",
      evidence: `[16:44:02] GET /static/app.[hash].js.map → 200 OK\n            ↳ 4.2 MB of unminified source recovered.`,
      remediation: 'Disable source-map generation in your production build, or upload them to your error tracker (e.g. Sentry) and exclude them from the public bundle.',
    },
  ]

  for (const f of scan1Findings) {
    await prisma.finding.upsert({
      where: { id: f.id },
      update: {},
      create: { ...f, status: 'open' },
    })
  }

  // Seed findings for scan 2 (older scan, more findings)
  const scan2Findings = [
    {
      id: 'demo-f-2-1',
      scanId: scan2.id,
      title: 'SQL Injection in search endpoint',
      severity: 'CRITICAL',
      category: 'Injection',
      description: 'The search endpoint passes user input directly into a SQL query without parameterization, allowing full database read/write access.',
      evidence: `[09:22:11] GET /api/search?q='; DROP TABLE users; --\n[09:22:11] Response: 500 Internal Server Error\n            ↳ Error: SQLITE_ERROR: table users does not exist`,
      remediation: 'Use parameterized queries or prepared statements for all database interactions. Never interpolate user input into SQL strings.',
    },
    {
      id: 'demo-f-2-2',
      scanId: scan2.id,
      title: 'Insecure Direct Object Reference in user profile endpoint',
      severity: 'CRITICAL',
      category: 'Access Control',
      description: "Any logged-in user can view any other user's profile data by changing the user ID in the URL. No authorization check is present.",
      evidence: `[09:25:03] GET /api/users/1048/profile → 200 OK (logged in as user 1047)\n            ↳ exposed: email, billing_address, subscription_tier`,
      remediation: 'Verify that the authenticated session user ID matches the requested resource ID before returning data.',
    },
    {
      id: 'demo-f-2-3',
      scanId: scan2.id,
      title: 'Cross-Site Request Forgery on account settings',
      severity: 'CRITICAL',
      category: 'CSRF',
      description: 'Account settings endpoints do not validate CSRF tokens, allowing malicious sites to submit forms on behalf of authenticated users.',
      evidence: `[09:30:44] POST /api/account/email (no CSRF token) → 200 OK\n            ↳ email changed from victim@corp.com to attacker@evil.com`,
      remediation: 'Implement CSRF token validation on all state-changing endpoints. Use the SameSite=Strict cookie attribute as an additional layer.',
    },
    {
      id: 'demo-f-2-4',
      scanId: scan2.id,
      title: 'Workspace owner can be deleted by any member',
      severity: 'HIGH',
      category: 'Access Control',
      description: 'A regular workspace member can delete the workspace owner, leaving the workspace in an inconsistent state with no owner.',
      evidence: `[09:40:21] DELETE /api/workspace/42/members/owner_id → 204 No Content\n            ↳ workspace.owner_id = null`,
      remediation: 'Add role checks on member-removal endpoints. Only owners and admins should be able to remove members.',
    },
    {
      id: 'demo-f-2-4b',
      scanId: scan2.id,
      title: 'Auth tokens stored in localStorage',
      severity: 'HIGH',
      category: 'Insecure Storage',
      description: "Session tokens and authentication credentials are written to localStorage rather than HttpOnly cookies. localStorage is accessible to any JavaScript on the page — including third-party scripts and XSS payloads. An attacker who achieves XSS can silently exfiltrate every token with a single line of code.",
      evidence: `[In-browser probe on authenticated session]\n> localStorage.getItem("auth_token")\n"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMDQ3..."\n↳ 1 authentication artefact found in localStorage.\n↳ Readable by any same-origin JavaScript.`,
      remediation: 'Store session tokens exclusively in HttpOnly, Secure, SameSite=Strict cookies. If using JWTs, issue short-lived tokens (≤15 min) via cookie and use a server-side refresh flow.',
    },
    {
      id: 'demo-f-2-5',
      scanId: scan2.id,
      title: 'No rate limit on login endpoint',
      severity: 'HIGH',
      category: 'Authentication',
      description: 'The login endpoint accepts unlimited password attempts, enabling credential-stuffing attacks.',
      evidence: `[09:45:00] Submitted 5,000 login attempts in 60s — no lockout triggered.`,
      remediation: 'Add rate limiting: 10 attempts per IP per 15 minutes.',
    },
    {
      id: 'demo-f-2-6',
      scanId: scan2.id,
      title: 'Verbose error messages expose database schema',
      severity: 'HIGH',
      category: 'Information Disclosure',
      description: 'Raw SQL exception text is returned in 500 responses, leaking table and column names.',
      evidence: `[09:50:12] GET /api/projects?sort=invalid\n            ↳ "syntax error ... FROM projects WHERE deleted_at IS NULL"`,
      remediation: 'Return generic 500 errors in production. Log details server-side only.',
    },
    {
      id: 'demo-f-2-7',
      scanId: scan2.id,
      title: 'Server header reveals exact framework version',
      severity: 'MEDIUM',
      category: 'Information Disclosure',
      description: 'HTTP responses include exact framework and version strings.',
      evidence: `Server: Express/4.18.2 (Node 18.7.0)`,
      remediation: "Use app.disable('x-powered-by') and remove Server header via reverse proxy.",
    },
    {
      id: 'demo-f-2-8',
      scanId: scan2.id,
      title: 'Cookies missing Secure and SameSite attributes',
      severity: 'MEDIUM',
      category: 'Configuration',
      description: 'Authentication cookies lack Secure and SameSite flags, enabling CSRF and network interception.',
      evidence: `Set-Cookie: session=eyJhbGc...; Path=/; HttpOnly\n↳ missing: Secure, SameSite`,
      remediation: 'Add Secure, HttpOnly, and SameSite=Strict to all authentication cookies.',
    },
    {
      id: 'demo-f-2-9',
      scanId: scan2.id,
      title: 'API tokens never expire',
      severity: 'MEDIUM',
      category: 'Access Control',
      description: 'Issued API tokens have no expiration date and cannot be rotated automatically.',
      evidence: `Token claims: { exp: null } — valid indefinitely.`,
      remediation: 'Set a 90-day default expiration. Show token age and last-used in the dashboard.',
    },
    {
      id: 'demo-f-2-10',
      scanId: scan2.id,
      title: 'Source maps exposed in production bundle',
      severity: 'LOW',
      category: 'Information Disclosure',
      description: 'Production JavaScript source maps are publicly accessible, exposing unminified source code.',
      evidence: `GET /static/app.[hash].js.map → 200 OK (4.2 MB)`,
      remediation: 'Disable source map generation in the production build or upload maps to error tracking only.',
    },
    {
      id: 'demo-f-2-11',
      scanId: scan2.id,
      title: 'Missing Content-Security-Policy header',
      severity: 'LOW',
      category: 'Configuration',
      description: 'No Content-Security-Policy header is present, leaving the application vulnerable to XSS injection attacks.',
      evidence: `HEAD /  →  200 OK\n↳ Content-Security-Policy: (absent)`,
      remediation: "Add a strict Content-Security-Policy header: default-src 'self'; script-src 'self'.",
    },
    {
      id: 'demo-f-2-12',
      scanId: scan2.id,
      title: 'HSTS not enforced',
      severity: 'LOW',
      category: 'Configuration',
      description: 'HTTP Strict Transport Security is not configured, allowing downgrade attacks.',
      evidence: `HEAD /  →  200 OK\n↳ Strict-Transport-Security: (absent)`,
      remediation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains header.',
    },
  ]

  for (const f of scan2Findings) {
    await prisma.finding.upsert({
      where: { id: f.id },
      update: {},
      create: { ...f, status: 'open' },
    })
  }

  // Seed findings for scan 3 (public scan, fewer findings)
  const scan3Findings = [
    {
      id: 'demo-f-3-1',
      scanId: scan3.id,
      title: 'Server header reveals exact framework version',
      severity: 'CRITICAL',
      category: 'Information Disclosure',
      description: 'HTTP responses expose the exact server framework and version, enabling targeted CVE exploitation.',
      evidence: `Server: Express/4.18.2 (Node 18.7.0)\nX-Powered-By: Express`,
      remediation: "Disable the X-Powered-By header and remove or override the Server header.",
    },
    {
      id: 'demo-f-3-2',
      scanId: scan3.id,
      title: 'Sensitive data in URL parameters',
      severity: 'HIGH',
      category: 'Information Disclosure',
      description: 'User session tokens are appended to URL parameters in several redirect flows, exposing them in server logs, browser history, and referrer headers.',
      evidence: `[16:48:22] GET /dashboard?token=eyJhbGciOiJIUzI1NiJ9... → 200 OK\n            ↳ token visible in referrer header on outbound links`,
      remediation: 'Move session tokens to HttpOnly cookies or Authorization headers. Never pass sensitive data in URL parameters.',
    },
    {
      id: 'demo-f-3-3',
      scanId: scan3.id,
      title: 'Cookies missing Secure and SameSite attributes',
      severity: 'HIGH',
      category: 'Configuration',
      description: 'Authentication cookies lack Secure and SameSite flags.',
      evidence: `Set-Cookie: session=eyJhbGc...; Path=/; HttpOnly`,
      remediation: 'Add Secure, HttpOnly, and SameSite=Strict to authentication cookies.',
    },
    {
      id: 'demo-f-3-4',
      scanId: scan3.id,
      title: 'Missing Content-Security-Policy header',
      severity: 'MEDIUM',
      category: 'Configuration',
      description: 'No Content-Security-Policy header, leaving the staging environment open to XSS attacks.',
      evidence: `Content-Security-Policy: (absent)`,
      remediation: "Add a strict CSP: default-src 'self'; script-src 'self'.",
    },
    {
      id: 'demo-f-3-5',
      scanId: scan3.id,
      title: 'Source maps exposed in production bundle',
      severity: 'LOW',
      category: 'Information Disclosure',
      description: 'Source maps are publicly accessible on staging, exposing unminified code.',
      evidence: `GET /static/app.[hash].js.map → 200 OK`,
      remediation: 'Disable source map output on staging and production builds.',
    },
    {
      id: 'demo-f-3-6',
      scanId: scan3.id,
      title: 'HSTS not enforced on staging',
      severity: 'LOW',
      category: 'Configuration',
      description: 'HSTS is missing on the staging environment, which shares cookies with production.',
      evidence: `Strict-Transport-Security: (absent)`,
      remediation: 'Apply HSTS headers consistently across staging and production.',
    },
  ]

  for (const f of scan3Findings) {
    await prisma.finding.upsert({
      where: { id: f.id },
      update: {},
      create: { ...f, status: 'open' },
    })
  }

  console.log('Seeded 3 demo scans with findings')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
