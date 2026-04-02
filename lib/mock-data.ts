import { Scan, Finding, DashboardStats } from './types'

export const MOCK_FINDINGS: Finding[] = [
  {
    id: 'f1',
    scanId: 'scan_demo',
    severity: 'critical',
    title: 'Insecure Direct Object Reference — Customer Records',
    category: 'IDOR',
    description:
      'The /v2/internal/customer_records endpoint accepts a user-controlled id parameter without authorization checks. Any authenticated user can access any other user\'s records by iterating the id value.',
    businessRisk:
      'Full customer data exposure. Any user can read billing info, contact details, and usage data of every other customer. This is a direct GDPR violation and would likely result in regulatory action.',
    howFound:
      'Agent logged in as test@example.com, identified the id=9921 pattern in a network request, then incremented and decremented the ID. All requests returned 200 with different users\' data.',
    howToFix:
      'In your records controller, add an ownership check before returning data: `if (record.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" })`. Apply this pattern to every resource endpoint.',
    effortEstimate: 'hours',
    references: [
      { label: 'OWASP IDOR', url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References' },
    ],
    endpoint: '/v2/internal/customer_records?id=9921',
    isFixed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f2',
    scanId: 'scan_demo',
    severity: 'high',
    title: 'JWT Signature Bypass via Algorithm Confusion',
    category: 'Authentication',
    description:
      'The API accepts JWTs signed with the "none" algorithm, allowing an attacker to forge tokens and impersonate any user without knowing the secret key.',
    businessRisk:
      'Complete authentication bypass. An attacker can generate a token claiming to be any user, including administrators, without needing credentials.',
    howFound:
      'Agent intercepted a JWT, decoded it, changed the algorithm to "none", removed the signature, and replayed the modified token. Server accepted it and returned authenticated data.',
    howToFix:
      'Explicitly whitelist accepted algorithms: `jwt.verify(token, secret, { algorithms: ["HS256"] })`. Never accept the "none" algorithm in production.',
    effortEstimate: 'minutes',
    references: [
      { label: 'JWT Security', url: 'https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/' },
    ],
    endpoint: '/api/auth/verify',
    isFixed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f3',
    scanId: 'scan_demo',
    severity: 'high',
    title: 'Password Reset Flow Leaks Account Existence',
    category: 'Information Disclosure',
    description:
      'The password reset endpoint returns different messages for registered vs unregistered email addresses, allowing attackers to enumerate valid accounts.',
    businessRisk:
      'An attacker can build a list of valid user emails by submitting addresses to the reset endpoint. This enables targeted phishing and credential stuffing attacks.',
    howFound:
      'Agent submitted a known-valid email and observed "Reset email sent". Then submitted a random email and observed "Email not found". The differential response reveals account existence.',
    howToFix:
      'Always return the same message regardless of whether the email exists: "If an account exists, you\'ll receive a reset email." This is a one-line change in your reset controller.',
    effortEstimate: 'minutes',
    references: [
      { label: 'OWASP Account Enumeration', url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account' },
    ],
    endpoint: '/api/auth/reset-password',
    isFixed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f4',
    scanId: 'scan_demo',
    severity: 'medium',
    title: 'Missing HttpOnly Flag on Session Cookie',
    category: 'Session Security',
    description:
      'The session cookie is accessible via JavaScript, making it vulnerable to theft via any XSS vulnerability in the application.',
    businessRisk:
      'If any XSS vulnerability is discovered, an attacker can steal all active session tokens using document.cookie, leading to account takeover.',
    howFound:
      'Agent inspected Set-Cookie headers in responses. The session cookie was set without the HttpOnly flag.',
    howToFix:
      'Add HttpOnly to your cookie configuration: `res.cookie("session", token, { httpOnly: true, secure: true, sameSite: "strict" })`.',
    effortEstimate: 'minutes',
    references: [
      { label: 'OWASP Cookie Security', url: 'https://owasp.org/www-community/controls/SecureCookieAttribute' },
    ],
    endpoint: '/api/auth/login',
    isFixed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f5',
    scanId: 'scan_demo',
    severity: 'medium',
    title: 'GraphQL Introspection Enabled in Production',
    category: 'API Security',
    description:
      'The GraphQL endpoint has introspection enabled, exposing the complete API schema including internal types, mutations, and field names.',
    businessRisk:
      'Attackers gain a complete map of your API surface, including internal fields not exposed in the UI. This dramatically accelerates targeted attacks.',
    howFound:
      'Agent sent a standard introspection query to /graphql. The server returned the full schema with 47 types and 23 mutations.',
    howToFix:
      'Disable introspection in production. In Apollo Server: `new ApolloServer({ introspection: process.env.NODE_ENV !== "production" })`.',
    effortEstimate: 'minutes',
    references: [
      { label: 'GraphQL Security', url: 'https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html' },
    ],
    endpoint: '/graphql',
    isFixed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f6',
    scanId: 'scan_demo',
    severity: 'low',
    title: 'Server Version Disclosed in Headers',
    category: 'Information Disclosure',
    description:
      'The X-Powered-By and Server headers reveal the exact framework and server version in use.',
    businessRisk:
      'Enables targeted attacks using known CVEs for the disclosed versions. Low severity in isolation, but increases risk when combined with other findings.',
    howFound:
      'Agent inspected response headers. Server: nginx/1.18.0 and X-Powered-By: Express were present on every response.',
    howToFix:
      'In Express: `app.disable("x-powered-by")`. In nginx: `server_tokens off;` in your nginx.conf.',
    effortEstimate: 'minutes',
    references: [],
    endpoint: '*',
    isFixed: false,
    createdAt: new Date().toISOString(),
  },
]

export const MOCK_SCAN: Scan = {
  id: 'scan_demo',
  userId: 'user_1',
  targetUrl: 'https://api.production-environment.io',
  type: 'authenticated',
  depth: 'standard',
  status: 'complete',
  overallSeverity: 'critical',
  executiveSummary:
    'Invariant identified 2 critical vulnerabilities that require immediate attention. The most severe allows any authenticated user to access any other customer\'s records without authorization. A second critical flaw allows complete authentication bypass via JWT algorithm confusion. 4 additional findings of high and medium severity were identified.',
  findingCounts: { critical: 1, high: 2, medium: 2, low: 1, info: 0 },
  findings: MOCK_FINDINGS,
  startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  completedAt: new Date().toISOString(),
}

export const MOCK_DASHBOARD: DashboardStats = {
  postureScore: 34,
  totalScans: 7,
  openFindings: { critical: 1, high: 2, medium: 3, low: 4 },
  recentScans: [
    MOCK_SCAN,
    {
      ...MOCK_SCAN,
      id: 'scan_2',
      targetUrl: 'https://app.myproduct.com',
      status: 'complete',
      overallSeverity: 'high',
      findingCounts: { critical: 0, high: 3, medium: 1, low: 2, info: 1 },
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(),
    },
    {
      ...MOCK_SCAN,
      id: 'scan_3',
      targetUrl: 'https://checkout.myproduct.com',
      status: 'complete',
      type: 'unauthenticated',
      overallSeverity: 'medium',
      findingCounts: { critical: 0, high: 0, medium: 4, low: 3, info: 2 },
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
    },
  ],
  postureHistory: [
    { date: '2024-07-01', score: 20 },
    { date: '2024-07-08', score: 28 },
    { date: '2024-07-15', score: 34 },
    { date: '2024-07-22', score: 34 },
    { date: '2024-07-29', score: 34 },
  ],
}