'use client'

import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { Icons } from '@/components/ui/icons'
import { RECENT_SCANS } from '@/lib/design-data'

const ALL_SCANS = [...RECENT_SCANS, ...RECENT_SCANS, ...RECENT_SCANS.slice(0, 2)].map((s, i) => ({ ...s, _i: i }))

export default function HistoryPage() {
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
          <span className="muted" style={{ fontSize: 13 }}>{ALL_SCANS.length} scans</span>
        </div>

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
              {ALL_SCANS.map((s, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 13 }}>{s.target}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{s.date}</td>
                  <td><span className="tag">{s.type}</span></td>
                  <td><span className="sev sev-critical" style={{ fontSize: 10, opacity: s.critical ? 1 : 0.3 }}>{s.critical}</span></td>
                  <td><span className="sev sev-high" style={{ fontSize: 10, opacity: s.high ? 1 : 0.3 }}>{s.high}</span></td>
                  <td><span className="sev sev-medium" style={{ fontSize: 10, opacity: s.medium ? 1 : 0.3 }}>{s.medium}</span></td>
                  <td><span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 13 }}><Icons.check /> Complete</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
