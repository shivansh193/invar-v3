'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Sev, PulseDot } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'

interface Finding {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  evidence: string
  remediation: string
  createdAt: string
}

interface Scan {
  id: string
  targetUrl: string
  type: string
  depth: string
  status: string
  findings: Finding[]
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 86400 * 2) return 'yesterday'
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function countBySeverity(findings: Finding[]) {
  const c = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const f of findings) {
    const s = f.severity.toLowerCase() as keyof typeof c
    if (s in c) c[s]++
  }
  return c
}

function computeScore(scans: Scan[]): number {
  if (scans.length === 0) return 100
  const latest = scans[0]
  const counts = countBySeverity(latest.findings)
  const penalty = counts.critical * 20 + counts.high * 10 + counts.medium * 4 + counts.low * 1
  return Math.max(0, 100 - penalty)
}

export default function DashboardPage() {
  const router = useRouter()
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scans')
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(data => {
        if (data?.scans) setScans(data.scans)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const completedScans = scans.filter(s => s.status === 'complete')
  const latestScan = completedScans[0] ?? null
  const allFindings = completedScans.flatMap(s => s.findings)
  const openCounts = countBySeverity(allFindings)
  const score = computeScore(completedScans)
  const latestScanCounts = latestScan ? countBySeverity(latestScan.findings) : { critical: 0, high: 0, medium: 0, low: 0 }
  const topFindings = latestScan
    ? [...latestScan.findings]
        .sort((a, b) => {
          const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
          return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
        })
        .slice(0, 3)
    : []

  const scoreClass = score >= 80 ? '' : score >= 50 ? 'warn' : 'danger'

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

        {loading ? (
          <div className="muted" style={{ fontSize: 13, padding: '40px 0' }}>Loading...</div>
        ) : scans.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>No scans yet</div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>Run your first scan to see your security posture here.</p>
            <Link href="/scan/new" className="btn btn-primary">Run first scan <Icons.arrow /></Link>
          </div>
        ) : (
          <>
            {/* Stat row */}
            <div className="stat-row" style={{ marginBottom: 24 }}>
              <div className={`stat ${scoreClass}`}>
                <div className="lbl">Security score</div>
                <div className="v tabular">{score}<small>/100</small></div>
                <div className="delta">Based on open findings</div>
              </div>
              <div className={`stat ${openCounts.critical > 0 ? 'danger' : ''}`}>
                <div className="lbl">Open critical findings</div>
                <div className="v tabular">{openCounts.critical}</div>
                <div className="delta">Last scan · {latestScan ? timeAgo(latestScan.createdAt) : '—'}</div>
              </div>
              <div className="stat">
                <div className="lbl">Last scan</div>
                <div className="v" style={{ fontSize: 28 }}>{latestScan ? timeAgo(latestScan.createdAt) : '—'}</div>
                <div className="delta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PulseDot /> {completedScans.length} scan{completedScans.length !== 1 ? 's' : ''} total
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 32 }}>
              <h2 className="display" style={{ fontSize: 20 }}>Open findings</h2>
              {latestScan && (
                <Link href={`/scan/${latestScan.id}`} className="muted" style={{ fontSize: 13 }}>View report →</Link>
              )}
            </div>

            <div className="severity-row" style={{ padding: 0, marginBottom: 32 }}>
              {[
                { cls: 'crit', label: 'Critical', count: openCounts.critical },
                { cls: 'high', label: 'High', count: openCounts.high },
                { cls: 'med', label: 'Medium', count: openCounts.medium },
                { cls: 'low', label: 'Low', count: openCounts.low },
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
                    {completedScans.slice(0, 5).map(s => {
                      const c = countBySeverity(s.findings)
                      return (
                        <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/scan/${s.id}`)}>
                          <td className="mono" style={{ fontSize: 13 }}>{new URL(s.targetUrl).hostname}</td>
                          <td className="muted" style={{ fontSize: 13 }}>{formatDate(s.createdAt)}</td>
                          <td><span className="tag">{s.type === 'authenticated' ? 'Authenticated' : 'Public'}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {c.critical > 0 && <span className="sev sev-critical" style={{ fontSize: 10 }}>{c.critical}</span>}
                              {c.high > 0 && <span className="sev sev-high" style={{ fontSize: 10 }}>{c.high}</span>}
                              {c.medium > 0 && <span className="sev sev-medium" style={{ fontSize: 10 }}>{c.medium}</span>}
                              {c.low > 0 && <span className="sev sev-low" style={{ fontSize: 10 }}>{c.low}</span>}
                              {s.findings.length === 0 && <span className="muted" style={{ fontSize: 12 }}>Clean</span>}
                            </div>
                          </td>
                          <td><span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 13 }}><Icons.check /> Complete</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h3 className="display" style={{ fontSize: 16, marginBottom: 16 }}>Next steps</h3>
                <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                  Prioritized fixes from your latest scan.
                </p>
                {topFindings.length === 0 ? (
                  <p className="muted" style={{ fontSize: 13 }}>No open findings. Your application looks clean.</p>
                ) : (
                  topFindings.map((f, i) => (
                    <div key={f.id} style={{ padding: '14px 0', borderBottom: i < topFindings.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span className="mono dim" style={{ fontSize: 12, marginTop: 4, width: 16, color: 'var(--text-3)' }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, marginBottom: 6 }}>{f.title}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Sev level={f.severity.toLowerCase()} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {latestScan && (
                  <Link href={`/scan/${latestScan.id}`} className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 18 }}>
                    Open all in report →
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
