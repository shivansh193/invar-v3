'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wordmark, Sev, PulseDot } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'
import { FINDINGS, SCAN_LOG_LINES, SAMPLE_TARGET } from '@/lib/design-data'

export default function ScanProgressPage() {
  const router = useRouter()
  const [visibleLines, setVisibleLines] = useState(0)
  const [foundFindings, setFoundFindings] = useState<typeof FINDINGS>([])
  const [elapsed, setElapsed] = useState(0)
  const termRef = useRef<HTMLDivElement>(null)

  // Tick log lines forward
  useEffect(() => {
    if (visibleLines >= SCAN_LOG_LINES.length) return
    const t = setTimeout(() => {
      setVisibleLines(v => v + 1)
    }, visibleLines === 0 ? 400 : 700 + Math.random() * 800)
    return () => clearTimeout(t)
  }, [visibleLines])

  // Add findings as lines fire
  useEffect(() => {
    const triggers: Record<number, number> = { 8: 0, 12: 4, 16: 2 }
    const fi = triggers[visibleLines - 1]
    if (fi !== undefined && !foundFindings.find(f => f.id === FINDINGS[fi].id)) {
      setFoundFindings(prev => [...prev, FINDINGS[fi]])
    }
  }, [visibleLines, foundFindings])

  // Elapsed timer
  useEffect(() => {
    const i = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(i)
  }, [])

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [visibleLines])

  const minutes = Math.floor(elapsed / 60)
  const seconds = (elapsed % 60).toString().padStart(2, '0')
  const isComplete = visibleLines >= SCAN_LOG_LINES.length

  return (
    <div className="scan-shell">
      <div className="scan-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Wordmark size={16} />
          <span style={{ color: 'var(--border-2)' }}>·</span>
          <div className="scan-target">
            <PulseDot /> Scanning <b className="mono">{SAMPLE_TARGET}</b>
            <span className="tag">Authenticated scan</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="muted mono tabular" style={{ fontSize: 13 }}>{minutes}:{seconds} elapsed</span>
          <span className="muted" style={{ fontSize: 13 }}>·</span>
          <span className="muted" style={{ fontSize: 13 }}>Typically 3–8 minutes</span>
          {isComplete ? (
            <Link href="/scan/demo" className="btn btn-primary btn-sm">
              View report <Icons.arrow />
            </Link>
          ) : (
            <button className="btn btn-ghost btn-sm">Cancel</button>
          )}
        </div>
      </div>

      <div className="scan-progress-bar" />

      <div className="scan-grid" style={{ flex: 1, height: 'calc(100vh - 97px)' }}>
        {/* Terminal */}
        <div ref={termRef} className="terminal">
          <div className="tline dim">$ invariant scan --target {SAMPLE_TARGET} --auth</div>
          <div className="tline dim">{'  '}using session: scn_a47b2c8 · agent: invariant-1.4.2</div>
          <div className="tline dim" style={{ marginBottom: 14 }}>{'  '}{'─'.repeat(44)}</div>

          {SCAN_LOG_LINES.slice(0, visibleLines).map((l, i) => (
            <div key={i} className={`tline ${l.cls || ''}`}>
              <span style={{ color: 'var(--text-4)', marginRight: 14 }}>[{l.t}]</span>
              {l.text}
            </div>
          ))}

          {!isComplete && <div className="tline"><span className="cursor" /></div>}

          {isComplete && (
            <>
              <div className="tline dim" style={{ marginTop: 14 }}>{'  '}{'─'.repeat(44)}</div>
              <div className="tline">→ Scan complete. 2 critical · 3 high · 3 medium · 1 low</div>
              <div className="tline dim">{'  '}Report ready: /reports/scn_a47b2c8</div>
            </>
          )}
        </div>

        {/* Live findings panel */}
        <div className="live-findings">
          <h3>
            Findings as we discover them
            <span className="count">{foundFindings.length} found</span>
          </h3>

          {foundFindings.length === 0 && (
            <div className="muted" style={{ fontSize: 13, padding: '24px 0' }}>
              Nothing yet. Findings will appear here in real time as the scan discovers them.
            </div>
          )}

          {foundFindings.map(f => (
            <div key={f.id} className="live-finding">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Sev level={f.severity} />
                <span style={{ flex: 1 }} />
                <span className="muted mono" style={{ fontSize: 11 }}>just now</span>
              </div>
              <div className="t">{f.title}</div>
              <div className="d mt-8">{f.short}</div>
            </div>
          ))}

          {!isComplete && foundFindings.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 4px', color: 'var(--text-2)', fontSize: 13 }}>
              <PulseDot /> Still searching for more...
            </div>
          )}

          {isComplete && (
            <Link href="/scan/demo" className="btn btn-primary" style={{ width: '100%', marginTop: 14 }}>
              Open full report <Icons.arrow />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
