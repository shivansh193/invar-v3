'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { Wordmark, Sev, PulseDot } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'
import { FINDINGS, SAMPLE_TARGET, COMPANY_NAME, DesignFinding } from '@/lib/design-data'

interface DbFinding {
  id: string
  title: string
  severity: string
  category: string
  description: string
  evidence: string
  remediation: string
  createdAt: string
}

interface DbScan {
  id: string
  targetUrl: string
  type: string
  status: string
  findings: DbFinding[]
  createdAt: string
}

type UnifiedFinding = {
  id: string
  severity: string
  category: string
  title: string
  effort?: string
  short: string
  means: string
  matters?: string
  evidence: string
  fix: string
  code?: string | null
}

function dbToUnified(f: DbFinding): UnifiedFinding {
  return {
    id: f.id,
    severity: f.severity.toLowerCase(),
    category: f.category || 'Security',
    title: f.title,
    short: f.description.split('\n')[0],
    means: f.description,
    evidence: f.evidence,
    fix: f.remediation,
  }
}

function designToUnified(f: DesignFinding): UnifiedFinding {
  return {
    id: f.id,
    severity: f.severity,
    category: f.category,
    title: f.title,
    effort: f.effort,
    short: f.short,
    means: f.means,
    matters: f.matters,
    evidence: f.evidence,
    fix: f.fix,
    code: f.code,
  }
}

function FindingItem({ finding, open, onToggle }: { finding: UnifiedFinding; open: boolean; onToggle: () => void }) {
  return (
    <div className={`finding ${open ? 'open' : ''}`}>
      <div className="finding-head" onClick={onToggle}>
        <Sev level={finding.severity} />
        <div className="title">{finding.title}</div>
        <div className="meta">
          <span className="tag">{finding.category}</span>
          {finding.effort && <span className="tag mono">{finding.effort}</span>}
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
            {finding.matters && (
              <div className="finding-section">
                <div className="lbl">Why this matters</div>
                <p>{finding.matters}</p>
              </div>
            )}
            <div className="finding-section">
              <div className="lbl">How we found it</div>
              <pre className="evidence">{finding.evidence}</pre>
            </div>
            <div className="finding-section">
              <div className="lbl">How to fix it</div>
              <p>{finding.fix}</p>
              {finding.code && <pre className="evidence" style={{ marginTop: 12 }}>{finding.code}</pre>}
            </div>
            {finding.effort && (
              <div className="finding-section">
                <div className="lbl">Effort estimate</div>
                <p className="inline-meta">A competent developer can fix this in approximately <b style={{ color: 'var(--text)' }}>{finding.effort}</b>.</p>
              </div>
            )}
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

function countBySeverity(findings: UnifiedFinding[]) {
  const c = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  for (const f of findings) {
    const s = f.severity as keyof typeof c
    if (s in c) c[s]++
  }
  return c
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [scan, setScan] = useState<DbScan | null>(null)
  const [loading, setLoading] = useState(true)

  const isDemo = id === 'demo'

  useEffect(() => {
    if (isDemo) {
      setLoading(false)
      setOpenId(FINDINGS[0]?.id ?? null)
      return
    }
    fetch(`/api/scans/${id}`)
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (r.status === 404) { setScan(null); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (data?.scan) {
          setScan(data.scan)
          const firstId = data.scan.findings[0]?.id ?? null
          setOpenId(firstId)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, isDemo, router])

  const unified: UnifiedFinding[] = useMemo(() => {
    if (isDemo) return FINDINGS.map(designToUnified)
    if (!scan) return []
    return scan.findings
      .map(dbToUnified)
      .sort((a, b) => {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
        return (order[a.severity] ?? 5) - (order[b.severity] ?? 5)
      })
  }, [isDemo, scan])

  const counts = useMemo(() => countBySeverity(unified), [unified])
  const filtered = filter === 'all' ? unified : unified.filter(f => f.severity === filter)

  const targetUrl = isDemo ? SAMPLE_TARGET : (scan ? new URL(scan.targetUrl).hostname : '—')
  const companyName = isDemo ? COMPANY_NAME : (scan ? new URL(scan.targetUrl).hostname.split('.').slice(-2)[0] : '')
  const scanDate = isDemo
    ? 'May 6, 2026'
    : scan
    ? new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'
  const scanType = isDemo ? 'Authenticated assessment' : scan ? (scan.type === 'authenticated' ? 'Authenticated assessment' : 'Public assessment') : '—'

  const topSeverity = counts.critical > 0
    ? 'CRITICAL'
    : counts.high > 0
    ? 'HIGH'
    : counts.medium > 0
    ? 'MEDIUM'
    : counts.low > 0
    ? 'LOW'
    : 'CLEAN'

  const gradeClass = topSeverity === 'CRITICAL' ? 'crit' : topSeverity === 'HIGH' ? 'high' : topSeverity === 'MEDIUM' ? 'med' : ''

  if (loading) {
    return (
      <AppShell>
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span className="muted" style={{ fontSize: 13 }}>Loading report...</span>
        </div>
      </AppShell>
    )
  }

  if (!isDemo && !scan) {
    return (
      <AppShell>
        <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 18, marginBottom: 12 }}>Report not found</div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>This scan doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link href="/dashboard" className="btn btn-ghost">Back to dashboard</Link>
        </div>
      </AppShell>
    )
  }

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
                <h1 className="report-h">{companyName ? companyName.charAt(0).toUpperCase() + companyName.slice(1) : ''} Security Assessment</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                  <span className="report-target">{targetUrl}</span>
                  <span className="muted">·</span>
                  <span className="muted" style={{ fontSize: 13 }}>{scanDate}</span>
                  <span className="muted">·</span>
                  <span className="muted" style={{ fontSize: 13 }}>{scanType}</span>
                </div>
              </div>
              {topSeverity !== 'CLEAN' && (
                <div className={`grade-card ${gradeClass}`}>
                  <div className="lbl">Overall grade</div>
                  <div className="v">{topSeverity}</div>
                  <div className="sub">Findings require remediation</div>
                </div>
              )}
            </div>
          </div>

          {/* Executive summary */}
          <div className="exec-summary">
            <div className="lbl">Executive summary</div>
            <p>
              {unified.length === 0
                ? <>This assessment found <b>no vulnerabilities</b>. The application appears clean based on automated testing.</>
                : <>
                    This assessment identified
                    {counts.critical > 0 && <> <b>{counts.critical} critical</b></>}
                    {counts.high > 0 && <>{counts.critical > 0 ? ' and' : ''} <b>{counts.high} high</b></>}
                    {(counts.critical > 0 || counts.high > 0) && ' severity'}
                    {' '}vulnerabilities in the {companyName} application.
                    {counts.critical > 0 && <> <b>Immediate remediation of the critical findings is recommended.</b></>}
                  </>
              }
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
            <Link href="/scan/new" className="btn btn-ghost"><Icons.refresh /> Run new scan</Link>
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
              <span>{filtered.length} of {unified.length} findings</span>
            </div>
          </div>

          {/* Findings */}
          <div className="findings">
            {filtered.length === 0 ? (
              <div className="muted" style={{ padding: '40px 0', textAlign: 'center', fontSize: 13 }}>
                No findings at this severity level.
              </div>
            ) : (
              filtered.map(f => (
                <FindingItem
                  key={f.id}
                  finding={f}
                  open={openId === f.id}
                  onToggle={() => setOpenId(openId === f.id ? null : f.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
