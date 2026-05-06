'use client'

import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { Sev, PulseDot } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'
import { FINDINGS, RECENT_SCANS } from '@/lib/design-data'

export default function DashboardPage() {
  const open = { critical: 2, high: 3, medium: 4, low: 1 }

  return (
    <AppShell>
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>WORKSPACE · MOSAIC</div>
            <h1 className="display" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Dashboard</h1>
          </div>
          <Link href="/scan/new" className="btn btn-primary">
            Run new scan <Icons.arrow />
          </Link>
        </div>

        {/* Stat row */}
        <div className="stat-row" style={{ marginBottom: 24 }}>
          <div className="stat warn">
            <div className="lbl">Security score</div>
            <div className="v tabular">68<small>/100</small></div>
            <div className="delta">↓ 4 since last scan</div>
          </div>
          <div className="stat danger">
            <div className="lbl">Open critical findings</div>
            <div className="v tabular">2</div>
            <div className="delta">Last scan · today</div>
          </div>
          <div className="stat">
            <div className="lbl">Last scan</div>
            <div className="v" style={{ fontSize: 28 }}>2 hours ago</div>
            <div className="delta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PulseDot /> Auto-scan: weekly
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 32 }}>
          <h2 className="display" style={{ fontSize: 20 }}>Open findings</h2>
          <Link href="/scan/demo" className="muted" style={{ fontSize: 13 }}>View report →</Link>
        </div>

        <div className="severity-row" style={{ padding: 0, marginBottom: 32 }}>
          {[
            { cls: 'crit', label: 'Critical', count: open.critical },
            { cls: 'high', label: 'High', count: open.high },
            { cls: 'med', label: 'Medium', count: open.medium },
            { cls: 'low', label: 'Low', count: open.low },
          ].map(s => (
            <div key={s.cls} className={`sev-stat ${s.cls}`} style={{ flex: 1, cursor: 'pointer' }}>
              <div className="n tabular">{s.count}</div>
              <div className="l">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Two-col: recent scans + next steps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 className="display" style={{ fontSize: 16 }}>Recent scans</h3>
              <Link href="/history" className="muted" style={{ fontSize: 13 }}>View all →</Link>
            </div>
            <table className="data">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Findings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_SCANS.map((s, i) => (
                  <tr key={i} onClick={() => {}}>
                    <td className="mono" style={{ fontSize: 13 }}>{s.target}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{s.date}</td>
                    <td><span className="tag">{s.type}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {s.critical > 0 && <span className="sev sev-critical" style={{ fontSize: 10 }}>{s.critical}</span>}
                        {s.high > 0 && <span className="sev sev-high" style={{ fontSize: 10 }}>{s.high}</span>}
                        {s.medium > 0 && <span className="sev sev-medium" style={{ fontSize: 10 }}>{s.medium}</span>}
                        {s.low > 0 && <span className="sev sev-low" style={{ fontSize: 10 }}>{s.low}</span>}
                      </div>
                    </td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 13 }}><Icons.check /> Complete</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 className="display" style={{ fontSize: 16, marginBottom: 16 }}>Next steps</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Prioritized fixes that close the most risk for the least effort.
            </p>
            {[
              { sev: 'critical', t: 'Fix the IDOR in your user API', e: '2 hrs' },
              { sev: 'critical', t: 'Invalidate sessions on password change', e: '1 hr' },
              { sev: 'high', t: 'Add rate limit to login endpoint', e: '2 hrs' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span className="mono dim" style={{ fontSize: 12, marginTop: 4, width: 16, color: 'var(--text-3)' }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>{s.t}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Sev level={s.sev} />
                    <span className="tag mono">{s.e}</span>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/scan/demo" className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 18 }}>
              Open all in report →
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
