'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Icons } from '@/components/ui/icons'

interface Finding {
  id: string
  severity: string
}

interface Scan {
  id: string
  targetUrl: string
  type: string
  status: string
  findings: Finding[]
  createdAt: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function countBySeverity(findings: Finding[]) {
  const c = { critical: 0, high: 0, medium: 0 }
  for (const f of findings) {
    const s = f.severity.toLowerCase() as keyof typeof c
    if (s in c) c[s]++
  }
  return c
}

export default function HistoryPage() {
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

  return (
    <AppShell>
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 className="display" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Scan history</h1>
            <p className="muted mt-8">Every scan you have run. Click any row to open the report.</p>
          </div>
          <Link href="/scan/new" className="btn btn-primary">Run new scan</Link>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ padding: 14, display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 13, marginRight: 8 }}>Filter:</span>
          <button className="btn btn-subtle btn-sm">Last 30 days ▾</button>
          <button className="btn btn-subtle btn-sm">All scan types ▾</button>
          <button className="btn btn-subtle btn-sm">Min severity ▾</button>
          <span style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 13 }}>
            {loading ? '—' : `${scans.length} scan${scans.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <span className="muted" style={{ fontSize: 13 }}>Loading...</span>
          </div>
        ) : scans.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>No scans yet</div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>Your scan history will appear here.</p>
            <Link href="/scan/new" className="btn btn-primary">Run first scan <Icons.arrow /></Link>
          </div>
        ) : (
          <div className="card">
            <table className="data">
              <thead>
                <tr>
                  <th>Target URL</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Critical</th>
                  <th>High</th>
                  <th>Medium</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scans.map(s => {
                  const c = countBySeverity(s.findings)
                  let hostname = s.targetUrl
                  try { hostname = new URL(s.targetUrl).hostname } catch {}
                  return (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/scan/${s.id}`)}>
                      <td className="mono" style={{ fontSize: 13 }}>{hostname}</td>
                      <td className="muted" style={{ fontSize: 13 }}>{formatDate(s.createdAt)}</td>
                      <td><span className="tag">{s.type === 'authenticated' ? 'Authenticated' : 'Public'}</span></td>
                      <td><span className="sev sev-critical" style={{ fontSize: 10, opacity: c.critical ? 1 : 0.3 }}>{c.critical}</span></td>
                      <td><span className="sev sev-high" style={{ fontSize: 10, opacity: c.high ? 1 : 0.3 }}>{c.high}</span></td>
                      <td><span className="sev sev-medium" style={{ fontSize: 10, opacity: c.medium ? 1 : 0.3 }}>{c.medium}</span></td>
                      <td>
                        {s.status === 'complete' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 13 }}>
                            <Icons.check /> Complete
                          </span>
                        )}
                        {s.status === 'running' && (
                          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Running...</span>
                        )}
                        {s.status === 'pending' && (
                          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Pending</span>
                        )}
                        {s.status === 'failed' && (
                          <span style={{ fontSize: 13, color: 'var(--danger)' }}>Failed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
