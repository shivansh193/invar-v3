export type DesignFinding = {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  title: string
  effort: string
  short: string
  means: string
  matters: string
  evidence: string
  fix: string
  code: string | null
}

export const FINDINGS: DesignFinding[] = [
  {
    id: 'f1',
    severity: 'critical',
    category: 'Access Control',
    title: 'Insecure Direct Object Reference in user profile endpoint',
    effort: '2 hours',
    short: "Any logged-in user can view any other user's profile data by changing the user ID in the URL.",
    means: "Any logged-in user can view any other user's profile data — including email address, billing information, and account history — by changing the numeric ID in the request URL. There is no authorization check that confirms the requester is the owner of the data being requested.",
    matters: "This is the type of finding that causes enterprise prospects to pause a deal or require remediation before signing. It also creates direct regulatory exposure under GDPR and CCPA: an unauthorized user accessing personal data is, by definition, a reportable data breach.",
    evidence: `[10:42:17] Logged in as test user (id: 1047)
[10:42:18] GET /api/users/1047/profile  →  200 OK
[10:42:19] Modified request: GET /api/users/1048/profile
[10:42:19] Response: 200 OK   ⚠ access granted to other user
            ↳ exposed: email, full_name, billing_address,
              subscription_tier, last_login_ip
[10:42:21] Confirmed across 12/12 sampled user IDs.`,
    fix: "Add an authorization check before returning user data. Verify that the authenticated session's user ID matches the requested resource ID — or that the user has admin role. The check belongs in the controller, before the database query runs.",
    code: `// Express middleware example
router.get('/api/users/:id/profile', auth, (req, res) => {
  if (req.params.id !== req.user.id && !req.user.isAdmin) {
    return res.sendStatus(403);
  }
  return getUserProfile(req.params.id).then(p => res.json(p));
});`,
  },
  {
    id: 'f2',
    severity: 'critical',
    category: 'Authentication',
    title: 'Session tokens not invalidated after password change',
    effort: '1 hour',
    short: 'Old session tokens remain valid after a user changes their password, so a stolen token retains full access.',
    means: "When a user changes their password, the old session tokens issued before the change are not revoked. An attacker who stole a session cookie before the password change still has full access to the account afterward — defeating the purpose of changing the password.",
    matters: "Password rotation is the standard response to a suspected account compromise. If old tokens stay live, the user has no way to lock an attacker out without contacting support. This will fail any SOC 2 access-control review.",
    evidence: `[11:08:02] Authenticated as user 1047, captured session_token_A
[11:08:14] Changed password via /api/account/password
[11:08:15] Response: 200 OK
[11:08:18] Replayed session_token_A on /api/me
[11:08:18] Response: 200 OK   ⚠ stale token still accepted
            ↳ token was valid for 47 minutes after password change`,
    fix: "On a successful password change, invalidate every session token associated with that user except the one that initiated the change. If you store sessions in Redis, delete the keys; if they're JWTs, increment a per-user token version claim and reject older versions.",
    code: null,
  },
  {
    id: 'f3',
    severity: 'high',
    category: 'Access Control',
    title: 'Workspace owner can be deleted by any member',
    effort: '3 hours',
    short: 'A regular workspace member can delete the workspace owner, leaving the workspace in an inconsistent state.',
    means: "The endpoint that removes a member from a workspace does not check the role of the target. A regular member can call it with the owner's ID and successfully remove the owner — leaving a workspace with no owner, broken billing ownership, and orphaned admin permissions.",
    matters: "Multi-tenant SaaS products are routinely tested for privilege boundaries during enterprise security reviews. A finding like this maps directly to \"horizontal privilege escalation\" on the OWASP Top 10 — and it makes the product look unfinished.",
    evidence: `[12:14:33] Authenticated as member (role=member)
[12:14:34] DELETE /api/workspace/42/members/owner_id
[12:14:34] Response: 204 No Content   ⚠ owner removed
[12:14:36] GET /api/workspace/42  →  200 OK
            ↳ workspace.owner_id = null`,
    fix: "Add a role check on the member-removal endpoint. Only owners and admins should be allowed to remove members, and removing the last owner should be explicitly forbidden — promote another member to owner first.",
    code: null,
  },
  {
    id: 'f4',
    severity: 'high',
    category: 'Information Disclosure',
    title: 'Verbose error messages expose database schema',
    effort: '1 hour',
    short: 'API errors return raw SQL exception text, leaking column names and table structure.',
    means: "When the database raises an error — for instance on a malformed query parameter — the API returns the raw exception message in the response body. This includes the SQL statement, table names, and column names of your internal schema.",
    matters: "Schema disclosure dramatically reduces the work an attacker has to do to find an exploitable bug. It is one of the first things a competent CISO will probe for in a security questionnaire.",
    evidence: `[13:44:51] GET /api/projects?sort=' OR 1=1 --
[13:44:51] Response: 500 Internal Server Error
            ↳ "syntax error at or near \"'\"
              LINE 1: SELECT id, owner_id, secret_token, ...
                      FROM projects WHERE deleted_at IS NULL
                      ORDER BY ' OR 1=1 --"`,
    fix: "Catch database exceptions in your error-handling middleware and return a generic 500 response in production. Log the full exception server-side; never include the SQL or stack trace in the response body.",
    code: null,
  },
  {
    id: 'f5',
    severity: 'high',
    category: 'Authentication',
    title: 'No rate limit on login endpoint',
    effort: '2 hours',
    short: 'The login endpoint accepts unlimited password attempts from a single IP, enabling credential-stuffing.',
    means: "There is no rate limit, lockout, or CAPTCHA on the login endpoint. A single IP can submit thousands of login attempts per minute, which makes credential-stuffing attacks against your users trivial.",
    matters: "Credential stuffing is the single most common attack against SaaS products. Most enterprise security questionnaires explicitly ask about login rate limiting — a \"no\" answer here is a deal-blocker.",
    evidence: `[14:20:00] Submitted 5,000 login attempts in 60s from a single IP.
[14:21:02] All 5,000 attempts received 401 Unauthorized.
            ↳ no lockout, no CAPTCHA, no slow-down.
            ↳ rate-limit headers absent from responses.`,
    fix: "Add a rate limit on POST /login: e.g. 10 attempts per IP per 15 minutes, and 5 attempts per email per 15 minutes. Lock the account temporarily after 10 failed attempts and require email confirmation to unlock.",
    code: null,
  },
  {
    id: 'f6',
    severity: 'medium',
    category: 'Information Disclosure',
    title: 'Server header reveals exact framework version',
    effort: '15 minutes',
    short: 'HTTP responses include the exact framework and version, simplifying targeted exploitation.',
    means: "Every response from your API includes a Server header that reveals the framework and minor version in use. Attackers use this to immediately match your stack against public CVE databases.",
    matters: "On its own this is low-impact, but it's asked about by name in many vendor security questionnaires. It signals that hardening hasn't been considered.",
    evidence: `[15:02:11] HEAD /api/health
            Server: Express/4.18.2 (Node 18.7.0)
            X-Powered-By: Express`,
    fix: "Disable or override the Server and X-Powered-By headers in your reverse proxy or framework config. In Express: app.disable('x-powered-by').",
    code: null,
  },
  {
    id: 'f7',
    severity: 'medium',
    category: 'Configuration',
    title: 'Cookies missing Secure and SameSite attributes',
    effort: '30 minutes',
    short: 'Authentication cookies are not marked Secure or SameSite=Strict, exposing them to network and CSRF attacks.',
    means: "The session cookie does not have the Secure flag (so it can be sent over plain HTTP) and does not have a SameSite attribute (so it is included on cross-site requests). This combination enables both network interception and CSRF.",
    matters: "These flags are table-stakes for any cookie-based auth. Their absence is a near-automatic finding in any pen test or SOC 2 audit.",
    evidence: `[15:38:44] POST /api/login → Set-Cookie:
            session=eyJhbGc...; Path=/; HttpOnly
            ↳ missing: Secure, SameSite=Strict`,
    fix: "Set Secure, HttpOnly, and SameSite=Strict on every authentication cookie. If you support cross-site embeds, use SameSite=Lax with explicit CSRF tokens.",
    code: null,
  },
  {
    id: 'f8',
    severity: 'medium',
    category: 'Access Control',
    title: 'API tokens never expire',
    effort: '4 hours',
    short: 'Personal API tokens issued from the dashboard have no expiration and cannot be rotated automatically.',
    means: "API tokens issued from the user dashboard have no expiration date and no enforced rotation. A token leaked into a Slack message, a screenshot, or a public GitHub commit retains full access indefinitely.",
    matters: "Token rotation is a SOC 2 control. Auditors will ask how long tokens live for and how they are rotated.",
    evidence: `[16:01:08] Generated API token via dashboard
[16:01:08] Inspected token claims: { exp: null }
            ↳ token valid forever, no rotation policy.`,
    fix: "Set a default expiration of 90 days on issued tokens. Allow users to choose a shorter window. Display token age and last-used timestamp prominently in the dashboard.",
    code: null,
  },
  {
    id: 'f9',
    severity: 'low',
    category: 'Information Disclosure',
    title: 'Source maps exposed in production bundle',
    effort: '20 minutes',
    short: 'JavaScript source maps are served from production, revealing your unminified codebase.',
    means: "Your production build serves .map files alongside the bundled JavaScript. Anyone who opens browser dev tools can see your unminified frontend code, including comments and any hardcoded keys that haven't been moved server-side.",
    matters: "Low impact on its own, but commonly asked about in security questionnaires under \"secure development practices.\"",
    evidence: `[16:44:02] GET /static/app.[hash].js.map → 200 OK
            ↳ 4.2 MB of unminified source recovered.`,
    fix: "Disable source-map generation in your production build, or upload them to your error tracker (e.g. Sentry) and exclude them from the public bundle.",
    code: null,
  },
]

export const SAMPLE_TARGET = 'app.usemosaic.com'
export const COMPANY_NAME = 'Mosaic'

export const SCAN_LOG_LINES = [
  { t: '00:00.2', text: `→ Resolving target: ${SAMPLE_TARGET}` },
  { t: '00:00.6', text: '→ TLS handshake complete (TLS 1.3, A grade)' },
  { t: '00:01.1', text: '→ Crawling public surface...' },
  { t: '00:02.4', text: '  • Discovered 47 routes' },
  { t: '00:03.2', text: '  • Discovered 18 forms' },
  { t: '00:04.0', text: '→ Authenticating as test user (id: 1047)' },
  { t: '00:05.3', text: '→ Session established. Beginning authenticated probes.' },
  { t: '00:06.7', text: '→ Probing /api/users/{id}/profile for IDOR...' },
  { t: '00:08.9', text: '⚠ Found issue: cross-user access at /api/users/{id}/profile', cls: 'find' },
  { t: '00:09.4', text: '  ↳ Confirmed across 12 sampled user IDs', cls: 'dim' },
  { t: '00:10.8', text: '→ Testing session lifecycle...' },
  { t: '00:13.2', text: '→ Probing rate-limits on /login...' },
  { t: '00:15.7', text: '⚠ Found issue: no rate-limit on /login', cls: 'find' },
  { t: '00:16.3', text: '→ Inspecting cookie attributes...' },
  { t: '00:17.1', text: '  • session cookie missing Secure, SameSite', cls: 'dim' },
  { t: '00:18.4', text: '→ Probing workspace member endpoints...' },
  { t: '00:21.1', text: '⚠ Found issue: privilege boundary on /workspace/members', cls: 'find' },
  { t: '00:22.0', text: '→ Triggering controlled errors to inspect responses...' },
  { t: '00:23.6', text: '  • verbose SQL exception in 500 body', cls: 'dim' },
]

export const RECENT_SCANS = [
  { target: 'app.usemosaic.com', date: 'May 6, 2026 · 14:02', type: 'Authenticated', critical: 2, high: 3, medium: 4, low: 1, status: 'complete' },
  { target: 'app.usemosaic.com', date: 'Apr 22, 2026 · 09:18', type: 'Authenticated', critical: 3, high: 4, medium: 6, low: 2, status: 'complete' },
  { target: 'staging.usemosaic.com', date: 'Apr 14, 2026 · 16:44', type: 'Authenticated', critical: 1, high: 2, medium: 3, low: 1, status: 'complete' },
  { target: 'app.usemosaic.com', date: 'Mar 30, 2026 · 11:02', type: 'Public', critical: 0, high: 1, medium: 2, low: 4, status: 'complete' },
  { target: 'marketing.usemosaic.com', date: 'Mar 12, 2026 · 08:30', type: 'Public', critical: 0, high: 0, medium: 1, low: 2, status: 'complete' },
]
