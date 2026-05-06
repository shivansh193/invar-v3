'use client'

import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { Icons } from '@/components/ui/icons'

const FAQS = [
  {
    q: 'Will my enterprise prospect actually accept this report?',
    a: "Yes. Invariant's reports use the same severity model and finding categories that traditional pen test firms use (OWASP, CWE), formatted to be immediately readable by a CISO. We've seen them accepted at customers from $50M to $40B in ARR. If a specific prospect requires a SOC 2 attestation instead, the Scale plan maps every finding to SOC 2 controls.",
  },
  {
    q: 'How is this different from a manual pen test?',
    a: "A traditional pen test is a human security engineer testing your product manually over 4–6 weeks. Invariant is an AI agent that explores your product the same way — testing access controls, business logic, and authentication. The category of finding is the same; the speed and cost are not. For most enterprise deals at the seed-to-Series-B stage, our report is sufficient.",
  },
  {
    q: 'Do I need a technical person to use this?',
    a: "No. You paste a URL, hand off a test account, and click run. Every finding in the report is written in plain English with the business risk and the specific fix. If you want to hand the fixes to a developer, the report includes code-level guidance.",
  },
  {
    q: 'What happens to my credentials after the scan?',
    a: "Test credentials are encrypted at rest, scoped to a single scan, and deleted within 30 days. We strongly recommend creating a dedicated test account rather than using a real one. Full details on our security page.",
  },
  {
    q: 'Can I run this on a staging environment first?',
    a: "Yes — and we recommend it. Staging is the right place to find findings before they ship. You can add staging and production as separate domains.",
  },
]

export default function PricingPage() {
  return (
    <AppShell>
      <div style={{ padding: '64px 32px 96px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 64px' }}>
          <div className="eyebrow" style={{ marginBottom: 22 }}>PRICING</div>
          <h1 className="display" style={{ fontSize: 'clamp(36px, 4vw, 52px)', letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: 18 }}>
            A pen test costs <span style={{ color: 'var(--text-3)', textDecoration: 'line-through' }}>$15,000</span> and takes 6 weeks.
            <br />This costs <span style={{ color: 'var(--accent)' }}>$199/month</span> and takes hours.
          </h1>
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.55 }}>
            The same category of finding. A report your enterprise prospects will accept. Run it as often as you need.
          </p>
        </div>

        <div className="pricing-grid">
          <div className="tier">
            <h3>Free</h3>
            <div className="price">$0<small> / forever</small></div>
            <div className="for">For founders who want to see what an attacker sees before they log in.</div>
            <ul>
              <li><Icons.check /><span>Public-surface scan (no login)</span></li>
              <li><Icons.check /><span>1 scan per day</span></li>
              <li><Icons.check /><span>Basic report (not shareable as PDF)</span></li>
              <li><Icons.check /><span>1 domain</span></li>
            </ul>
            <Link href="/scan/new" className="btn btn-ghost">Start free — no credit card</Link>
          </div>

          <div className="tier feat">
            <h3>Growth</h3>
            <div className="price">$199<small> / month</small></div>
            <div className="for">For founders preparing for enterprise deals or compliance.</div>
            <ul>
              <li><Icons.check /><span>Full authenticated scan</span></li>
              <li><Icons.check /><span>Tests access controls, permissions, business logic</span></li>
              <li><Icons.check /><span>Professional PDF report</span></li>
              <li><Icons.check /><span>Unlimited scans</span></li>
              <li><Icons.check /><span>API access for CI/CD integration</span></li>
              <li><Icons.check /><span>Team access (up to 5 seats)</span></li>
            </ul>
            <Link href="/scan/new" className="btn btn-primary">Get the report</Link>
            <p className="muted mt-16" style={{ fontSize: 12, textAlign: 'center' }}>
              Cancel anytime. Most teams see ROI on their first deal.
            </p>
          </div>

          <div className="tier">
            <h3>Scale</h3>
            <div className="price">$499<small> / month</small></div>
            <div className="for">For companies with active compliance programs (SOC 2, ISO 27001).</div>
            <ul>
              <li><Icons.check /><span>Everything in Growth</span></li>
              <li><Icons.check /><span>Cloud infrastructure audit (AWS, GCP, Azure)</span></li>
              <li><Icons.check /><span>SOC 2 control mapping on every finding</span></li>
              <li><Icons.check /><span>White-labeled reports (your logo)</span></li>
              <li><Icons.check /><span>Priority support</span></li>
            </ul>
            <button className="btn btn-ghost">Talk to us</button>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 880, margin: '96px auto 0' }}>
          <h2 className="display" style={{ fontSize: 28, marginBottom: 28, letterSpacing: '-0.02em' }}>
            Common questions
          </h2>
          {FAQS.map((f, i) => (
            <div key={i} style={{ padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
              <h3 className="display" style={{ fontSize: 18, marginBottom: 12 }}>{f.q}</h3>
              <p className="muted" style={{ fontSize: 15, lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
