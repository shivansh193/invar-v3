'use client'

import { useState, useMemo } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Wordmark, Sev, PulseDot } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'
import { FINDINGS, SAMPLE_TARGET, COMPANY_NAME, DesignFinding } from '@/lib/design-data'

function FindingItem({ finding, open, onToggle }: { finding: DesignFinding; open: boolean; onToggle: () => void }) {
  return (
    <div className={`finding ${open ? 'open' : ''}`}>
      <div className="finding-head" onClick={onToggle}>
        <Sev level={finding.severity} />
        <div className="title">{finding.title}</div>
        <div className="meta">
          <span className="tag">{finding.category}</span>
          <span className="tag mono">{finding.effort}</span>
          <span className="chev"><Icons.chevron /></span>
        </div>
      </div>
      <div className="finding-body-wrap">
        <div>
          <div className="finding-body">
            <div className="finding-section">
              <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{finding.short}</p>
            </div>
            <div className="finding-section">
              <div className="lbl">What this means</div>
              <p>{finding.means}</p>
            </div>
            <div className="finding-section">
              <div className="lbl">Why this matters</div>
              <p>{finding.matters}</p>
            </div>
            <div className="finding-section">
              <div className="lbl">How we found it</div>
              <pre className="evidence">{finding.evidence}</pre>
            </div>
            <div className="finding-section">
              <div className="lbl">How to fix it</div>
              <p>{finding.fix}</p>
              {finding.code && <pre className="evidence" style={{ marginTop: 12 }}>{finding.code}</pre>}
            </div>
            <div className="finding-section">
              <div className="lbl">Effort estimate</div>
              <p className="inline-meta">A competent developer can fix this in approximately <b style={{ color: 'var(--text)' }}>{finding.effort}</b>.</p>
            </div>
            <div className="finding-foot">
              <button className="btn btn-subtle btn-sm"><Icons.check /> Mark as fixed</button>
              <button className="btn btn-subtle btn-sm"><Icons.share /> Share this finding</button>
              <button className="btn btn-subtle btn-sm">Add note</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState<string | null>('f1')

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    FINDINGS.forEach(f => { c[f.severity]++ })
    return c
  }, [])

  const filtered = filter === 'all' ? FINDINGS : FINDINGS.filter(f => f.severity === filter)

  return (
    <AppShell>
      <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="report-paper">
          {/* Header */}
          <div className="report-header">
            <div className="report-meta">
              <Wordmark size={14} />
              <span style={{ color: 'var(--border-2)' }}>·</span>
              <span>SECURITY ASSESSMENT REPORT</span>
            </div>
            <div className="report-title-row">
              <div>
                <h1 className="report-h">{COMPANY_NAME} Security Assessment</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                  <span className="report-target">{SAMPLE_TARGET}</span>
                  <span className="muted">·</span>
                  <span className="muted" style={{ fontSize: 13 }}>May 6, 2026</span>
                  <span className="muted">·</span>
                  <span className="muted" style={{ fontSize: 13 }}>Authenticated assessment</span>
                  <span className="muted">·</span>
                  <span className="muted" style={{ fontSize: 13 }}>Run time: 7m 22s</span>
                </div>
              </div>
              <div className="grade-card crit">
                <div className="lbl">Overall grade</div>
                <div className="v">CRITICAL</div>
                <div className="sub">Findings require remediation</div>
              </div>
            </div>
          </div>

          {/* Executive summary */}
          <div className="exec-summary">
            <div className="lbl">Executive summary</div>
            <p>
              This assessment identified <b>{counts.critical} critical</b> and <b>{counts.high} high</b> severity
              vulnerabilities in {COMPANY_NAME}&rsquo;s application. The most significant finding allows any
              authenticated user to access other users&rsquo; private data — including email, billing
              information, and account history. <b>Immediate remediation of the critical findings is
              recommended before sharing customer data with enterprise clients.</b>
            </p>
          </div>

          {/* Severity stats */}
          <div className="severity-row">
            {[
              { cls: 'crit', label: 'Critical', n: counts.critical },
              { cls: 'high', label: 'High', n: counts.high },
              { cls: 'med', label: 'Medium', n: counts.medium },
              { cls: 'low', label: 'Low', n: counts.low },
              { cls: 'info', label: 'Info', n: counts.info },
            ].map(s => (
              <div key={s.cls} className={`sev-stat ${s.cls}`}>
                <div className="n tabular">{s.n}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="report-actions">
            <button className="btn btn-primary"><Icons.download /> Download PDF</button>
            <button className="btn btn-ghost"><Icons.share /> Share report</button>
            <button className="btn btn-ghost"><Icons.refresh /> Run new scan</button>
            <span style={{ flex: 1 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: 13 }}>
              <PulseDot /> Report active · last refreshed today
            </span>
          </div>

          {/* Toolbar */}
          <div className="report-toolbar">
            <div className="filter-bar">
              {['all', 'critical', 'high', 'medium', 'low'].map(k => (
                <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>
                  {k === 'all' ? 'All' : k.charAt(0).toUpperCase() + k.slice(1)}
                  {k !== 'all' && counts[k as keyof typeof counts] > 0 && (
                    <span style={{ marginLeft: 6, opacity: 0.6 }}>{counts[k as keyof typeof counts]}</span>
                  )}
                </button>
              ))}
              <button>Fixed</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', fontSize: 13 }}>
              <span>Sorted by severity</span>
              <span>·</span>
              <span>{filtered.length} of {FINDINGS.length} findings</span>
            </div>
          </div>

          {/* Findings */}
          <div className="findings">
            {filtered.map(f => (
              <FindingItem
                key={f.id}
                finding={f}
                open={openId === f.id}
                onToggle={() => setOpenId(openId === f.id ? null : f.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
