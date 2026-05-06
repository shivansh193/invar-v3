'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { AppShell } from '@/components/layout/app-shell'
import { Icons } from '@/components/ui/icons'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'account' | 'billing' | 'team' | 'api'>('account')
  const [billingLoading, setBillingLoading] = useState(false)

  const isPaid = (session?.user as { plan?: string })?.plan === 'growth'

  async function handleUpgrade() {
    setBillingLoading(true)
    const res = await fetch('/api/billing/create-checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setBillingLoading(false)
  }

  async function handleManageBilling() {
    setBillingLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setBillingLoading(false)
  }

  return (
    <AppShell>
      <div className="page">
        <h1 className="display" style={{ fontSize: 32, letterSpacing: '-0.02em', marginBottom: 8 }}>Settings</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Manage your account, billing, team, and API access.</p>

        <div className="settings-tabs">
          {(['account', 'billing', 'team', 'api'] as const).map(t => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'account' && (
          <div>
            <div className="settings-row">
              <div>
                <div className="lbl">Name</div>
                <div className="lbl-d">Shown on reports you share.</div>
              </div>
              <div className="ctrl"><input className="input" defaultValue={session?.user?.name ?? ''} /></div>
            </div>
            <div className="settings-row">
              <div>
                <div className="lbl">Email</div>
                <div className="lbl-d">Used for sign-in and report sharing.</div>
              </div>
              <div className="ctrl"><input className="input" defaultValue={session?.user?.email ?? ''} readOnly /></div>
            </div>
            <div className="settings-row">
              <div>
                <div className="lbl">Password</div>
                <div className="lbl-d">Last changed 24 days ago.</div>
              </div>
              <div className="ctrl"><button className="btn btn-ghost">Change password</button></div>
            </div>
            <div className="settings-row">
              <div>
                <div className="lbl" style={{ color: 'var(--crit)' }}>Delete account</div>
                <div className="lbl-d">Permanently delete your account and all reports.</div>
              </div>
              <div className="ctrl">
                <button className="btn btn-ghost" style={{ color: 'var(--crit)', borderColor: 'rgba(220,38,38,0.3)' }}>
                  Delete account
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div>
            <div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="display" style={{ fontSize: 18 }}>{isPaid ? 'Growth plan' : 'Free plan'}</span>
                  <span className="tag" style={{ color: 'var(--accent)', borderColor: 'var(--accent-line)' }}>Active</span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {isPaid ? '$199 / month · Next billing: June 6, 2026' : 'Upgrade to run authenticated scans'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isPaid ? (
                  <button className="btn btn-ghost" onClick={handleManageBilling} disabled={billingLoading}>
                    {billingLoading ? 'Loading…' : 'Manage billing'}
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleUpgrade} disabled={billingLoading}>
                    {billingLoading ? 'Loading…' : 'Upgrade to Growth'}
                  </button>
                )}
              </div>
            </div>

            {isPaid && (
              <>
                <h3 className="display" style={{ fontSize: 16, marginBottom: 12 }}>Invoice history</h3>
                <div className="card">
                  <table className="data">
                    <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th /></tr></thead>
                    <tbody>
                      {['May 6, 2026', 'Apr 6, 2026', 'Mar 6, 2026', 'Feb 6, 2026'].map((d, i) => (
                        <tr key={i}>
                          <td>{d}</td>
                          <td className="tabular">$199.00</td>
                          <td><span style={{ color: 'var(--accent)' }}>Paid</span></td>
                          <td style={{ textAlign: 'right' }}><button className="btn btn-subtle btn-sm"><Icons.download /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'team' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 className="display" style={{ fontSize: 16, marginBottom: 4 }}>Team members</h3>
                <p className="muted" style={{ fontSize: 13 }}>3 of 5 seats used on Growth plan.</p>
              </div>
              <button className="btn btn-primary btn-sm">Invite member</button>
            </div>
            <div className="card">
              {[
                { n: 'Sarah Chen', e: 'sarah@usemosaic.com', r: 'Admin' },
                { n: 'Marcus Reed', e: 'marcus@usemosaic.com', r: 'Member' },
                { n: 'Priya Vance', e: 'priya@usemosaic.com', r: 'Viewer' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 20px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="avatar">{m.n.split(' ').map(n => n[0]).join('')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14 }}>{m.n}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{m.e}</div>
                  </div>
                  <span className="tag">{m.r}</span>
                  <button className="btn btn-subtle btn-sm">Manage</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'api' && (
          <div>
            <div className="settings-row">
              <div>
                <div className="lbl">API key</div>
                <div className="lbl-d">Use this to trigger scans from your CI.</div>
              </div>
              <div className="ctrl">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="input mono" value="inv_live_a47b2c8d3e9f1a6b5c8d3e9f1a6b" readOnly style={{ maxWidth: 380 }} />
                  <button className="btn btn-subtle btn-sm"><Icons.copy /></button>
                  <button className="btn btn-ghost btn-sm">Regenerate</button>
                </div>
              </div>
            </div>

            <h3 className="display" style={{ fontSize: 16, margin: '32px 0 12px' }}>Examples</h3>
            {[
              { t: 'Trigger a scan', code: `curl -X POST https://api.invariant.dev/v1/scans \\\n  -H "Authorization: Bearer $INVARIANT_KEY" \\\n  -d '{ "target": "https://app.usemosaic.com", "type": "authenticated" }'` },
              { t: 'Get scan results', code: `curl https://api.invariant.dev/v1/scans/scn_a4f3 \\\n  -H "Authorization: Bearer $INVARIANT_KEY"` },
              { t: 'Download report as PDF', code: `curl https://api.invariant.dev/v1/scans/scn_a4f3/report.pdf \\\n  -H "Authorization: Bearer $INVARIANT_KEY" \\\n  -o report.pdf` },
            ].map((ex, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>{ex.t}</div>
                <pre className="evidence" style={{ color: 'var(--text)' }}>{ex.code}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
