'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wordmark, Sev } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const router = useRouter()

  function handleScan(e: React.FormEvent) {
    e.preventDefault()
    router.push('/scan/new' + (url ? `?url=${encodeURIComponent(url)}` : ''))
  }

  return (
    <div className="report-shell">
      <nav className="lp-nav">
        <Wordmark />
        <div className="lp-nav-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/scan/demo">Sample report</Link>
          <a>Docs</a>
          <Link href="/login">Sign in</Link>
        </div>
        <Link href="/scan/new" className="btn btn-primary btn-sm">Get started</Link>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 22 }}>
          <span className="pulse-dot" /> SECURITY · UNBLOCKED
        </div>
        <h1>
          The security report that <span className="accent">unblocks your enterprise deal.</span>
        </h1>
        <p className="sub">
          Invariant scans your product like a real attacker would and generates a professional
          security report your prospects and auditors will accept.
        </p>
        <form className="url-form" onSubmit={handleScan}>
          <input type="text" placeholder="https://app.yourcompany.com" value={url} onChange={e => setUrl(e.target.value)} />
          <button type="submit" className="btn btn-primary">Get my report <Icons.arrow /></button>
        </form>
        <div className="fineprint">
          <span><span className="dot" /> Free scan</span>
          <span><span className="dot" /> No credit card</span>
          <span><span className="dot" /> Report ready in minutes</span>
        </div>
        <div style={{ marginTop: 18 }}>
          <Link href="/scan/demo" className="btn btn-ghost btn-sm">See what the report looks like →</Link>
        </div>
      </section>

      {/* Social proof */}
      <div className="quote">
        <blockquote>
          &ldquo;We had a $340k deal stuck on &lsquo;send your latest pen test.&rsquo; We had Invariant&rsquo;s report
          back the same afternoon. The deal closed two weeks later.&rdquo;
        </blockquote>
        <cite>— Sarah Chen, founder &amp; CEO of Mosaic</cite>
        <div className="logos" style={{ marginTop: 8 }}>
          {['FORGE', 'Quill', 'Mosaic', 'Vellum', 'Northwind', 'PARSEC'].map(n => (
            <span key={n} className="logo-text">{n}</span>
          ))}
        </div>
      </div>

      {/* Problem */}
      <section className="lp-section" style={{ paddingTop: 48 }}>
        <div className="section-eyebrow">The deal-blocker</div>
        <h2 className="section-h">Your enterprise deal is blocked. <span style={{ color: 'var(--text-3)' }}>Here&rsquo;s why.</span></h2>
        <div className="grid-3">
          {[
            { n: '01', h: 'They asked for a pen test', p: 'A traditional penetration test costs $15,000–$50,000 and takes 4–6 weeks. Your deal cannot wait that long.' },
            { n: '02', h: 'They sent a security questionnaire', p: '200 questions about your infrastructure, access controls, and incident response. You do not know where to start.' },
            { n: '03', h: 'They want a security posture report', p: 'Proof that you have thought about security and found the issues before they did. You do not have one.' },
          ].map(c => (
            <div key={c.n} className="problem-card">
              <div className="num">{c.n}</div>
              <h3>{c.h}</h3>
              <p>{c.p}</p>
            </div>
          ))}
        </div>
        <p className="muted mt-32" style={{ maxWidth: 720, fontSize: 16, lineHeight: 1.6 }}>
          Invariant gives you a professional security report in hours. The same category of finding
          as a manual pen test, at a fraction of the cost and time.
        </p>
      </section>

      {/* How it works */}
      <section className="lp-section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="section-eyebrow">How it works</div>
        <h2 className="section-h">Three steps. <span style={{ color: 'var(--accent)' }}>No engineering required.</span></h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">STEP 01</div>
            <h3>Enter your URL</h3>
            <p>Paste in your app URL. No installation, no configuration, no engineering time required.</p>
            <div className="step-visual">
              <div style={{ color: 'var(--text-3)', marginBottom: 10, fontSize: 11 }}>$ invariant scan</div>
              <div>https://app.usemosaic.com<span className="cursor" /></div>
            </div>
          </div>
          <div className="step">
            <div className="step-num">STEP 02</div>
            <h3>Invariant explores your product</h3>
            <p>Our agent logs in and explores your product the way a real attacker would — testing login flows, permissions, and data access.</p>
            <div className="step-visual">
              <div style={{ color: 'var(--accent)' }}>→ Authenticating as test user</div>
              <div style={{ color: 'var(--accent)' }}>→ Probing /api/users/{'{id}'}</div>
              <div style={{ color: 'var(--high)' }}>⚠ Found issue: cross-user access</div>
              <div style={{ color: 'var(--accent)' }}>→ Testing session lifecycle...</div>
            </div>
          </div>
          <div className="step">
            <div className="step-num">STEP 03</div>
            <h3>Get your report</h3>
            <p>A professional PDF with every finding in plain English, specific fixes, severities, and an executive summary you can forward.</p>
            <div className="step-visual" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Sev level="critical" /><span style={{ fontSize: 13 }}>IDOR — user profile</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Sev level="high" /><span style={{ fontSize: 13 }}>No login rate-limit</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Sev level="medium" /><span style={{ fontSize: 13 }}>Cookie attributes</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare */}
      <section className="lp-section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="section-eyebrow">Side-by-side</div>
        <h2 className="section-h">Invariant vs. a traditional pen test</h2>
        <div className="compare">
          <table>
            <thead>
              <tr><th /><th>Traditional Pen Test</th><th className="us">Invariant</th></tr>
            </thead>
            <tbody>
              <tr><td className="label">Cost</td><td style={{ fontFamily: 'var(--font-mono)' }}>$15,000 – $50,000</td><td className="us" style={{ fontFamily: 'var(--font-mono)' }}><b style={{ color: 'var(--text)' }}>$199 / month</b></td></tr>
              <tr><td className="label">Time to report</td><td>4 – 6 weeks</td><td className="us"><b style={{ color: 'var(--text)' }}>Hours</b></td></tr>
              <tr><td className="label">Repeatable</td><td><span style={{ color: 'var(--text-4)' }}>✕</span> Point in time</td><td className="us"><span style={{ color: 'var(--accent)' }}>✓</span> Run anytime</td></tr>
              <tr><td className="label">Accepted by enterprise</td><td><span style={{ color: 'var(--accent)' }}>✓</span> Yes</td><td className="us"><span style={{ color: 'var(--accent)' }}>✓</span> Yes</td></tr>
              <tr><td className="label">Requires scheduling</td><td><span style={{ color: 'var(--text-4)' }}>✕</span> 2–3 weeks lead time</td><td className="us"><span style={{ color: 'var(--accent)' }}>✓</span> Run now</td></tr>
              <tr><td className="label">Plain-English report</td><td><span style={{ color: 'var(--text-4)' }}>✕</span> Sometimes</td><td className="us"><span style={{ color: 'var(--accent)' }}>✓</span> Always</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Sample finding */}
      <section className="lp-section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="section-eyebrow">A finding from a real report</div>
        <h2 className="section-h">This is what your prospect will read.</h2>
        <div className="finding-preview">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <Sev level="critical" />
            <span className="tag">Access Control</span>
            <span className="tag mono">Effort · 2 hrs</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.015em', marginBottom: 18 }}>
            Insecure Direct Object Reference in user profile endpoint
          </h3>
          <div className="finding-section">
            <div className="lbl">What this means</div>
            <p>Any logged-in user can view any other user&rsquo;s profile data — including email address, billing information, and account history — by changing the numeric ID in the request URL.</p>
          </div>
          <div className="finding-section">
            <div className="lbl">Why it matters</div>
            <p>This is the type of finding that pauses an enterprise deal. It creates direct regulatory exposure under GDPR and CCPA: an unauthorized user accessing personal data is a reportable data breach.</p>
          </div>
          <div className="finding-section">
            <div className="lbl">How to fix it</div>
            <p>Add an authorization check that verifies the authenticated user&rsquo;s ID matches the requested resource ID, or that the user has admin role. The check belongs in the controller, before the database query runs.</p>
          </div>
          <div style={{ marginTop: 24 }}>
            <Link href="/scan/demo" className="btn btn-ghost btn-sm">See the full sample report <Icons.arrow /></Link>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="lp-section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="section-eyebrow">Pricing</div>
        <h2 className="section-h">Two plans. <span style={{ color: 'var(--text-3)' }}>One job: unblock the deal.</span></h2>
        <div className="grid-2 mt-32" style={{ maxWidth: 880 }}>
          <div className="tier">
            <h3>Free</h3>
            <div className="price">$0<small> / forever</small></div>
            <div className="for">Scan your public site. See what an attacker sees before you log in.</div>
            <ul>
              <li><Icons.check /><span>Public-surface scan</span></li>
              <li><Icons.check /><span>1 scan per day</span></li>
              <li><Icons.check /><span>Basic report</span></li>
            </ul>
            <Link href="/scan/new" className="btn btn-ghost">Start free</Link>
          </div>
          <div className="tier feat">
            <h3>Growth</h3>
            <div className="price">$199<small> / month</small></div>
            <div className="for">Full authenticated scan. The report your enterprise prospects accept.</div>
            <ul>
              <li><Icons.check /><span>Full authenticated scan</span></li>
              <li><Icons.check /><span>Tests access controls &amp; business logic</span></li>
              <li><Icons.check /><span>Professional PDF report</span></li>
              <li><Icons.check /><span>Unlimited scans</span></li>
              <li><Icons.check /><span>API access for CI/CD</span></li>
            </ul>
            <Link href="/scan/new" className="btn btn-primary">Get the report</Link>
          </div>
        </div>
        <p className="muted mt-24" style={{ textAlign: 'center', fontSize: 15 }}>
          A traditional pen test costs <b style={{ color: 'var(--text)' }}>$15,000</b>. This is <b style={{ color: 'var(--accent)' }}>$199</b>.
        </p>
      </section>

      {/* CTA band */}
      <section className="cta-band">
        <h2>Your next enterprise deal will ask for this. <span style={{ color: 'var(--text-3)' }}>Get your report before they do.</span></h2>
        <form className="url-form" onSubmit={handleScan}>
          <input type="text" placeholder="https://app.yourcompany.com" value={url} onChange={e => setUrl(e.target.value)} />
          <button type="submit" className="btn btn-primary">Scan free <Icons.arrow /></button>
        </form>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <Wordmark />
            <p className="muted mt-16" style={{ fontSize: 13, maxWidth: 320 }}>
              The security report that unblocks your enterprise deal. Built by founders who got tired of losing deals to questionnaires.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/scan/demo">Sample report</Link></li>
              <li><a>Changelog</a></li>
              <li><a>API docs</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul><li><a>About</a></li><li><a>Customers</a></li><li><a>Careers</a></li><li><a>Contact</a></li></ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul><li><a>Terms</a></li><li><a>Privacy</a></li><li><a>Security</a></li><li><a>Disclosure</a></li></ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
