'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wordmark, Sev, PulseDot } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'

interface LiveFinding {
  id: string
  title: string
  severity: string
  description: string
  evidence: string
  remediation: string
}

interface TermLine {
  text: string
  cls?: string
}

export default function ScanProgressPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lines, setLines] = useState<TermLine[]>([])
  const [findings, setFindings] = useState<LiveFinding[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [targetUrl, setTargetUrl] = useState('')
  const [scanType, setScanType] = useState('')
  const termRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  // Fetch scan info for the header display
  useEffect(() => {
    fetch(`/api/scans/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data?.scan) {
          try {
            setTargetUrl(new URL(data.scan.targetUrl).hostname)
          } catch {
            setTargetUrl(data.scan.targetUrl)
          }
          setScanType(data.scan.type === 'authenticated' ? 'Authenticated scan' : 'Public scan')
        }
      })
      .catch(() => {})
  }, [id])

  // Connect to SSE progress stream
  useEffect(() => {
    const es = new EventSource(`/api/scans/${id}/progress`)
    esRef.current = es

    es.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.message) {
          const cls = data.message.startsWith('⚠') ? 'find' : data.message.startsWith('  ') ? 'dim' : ''
          setLines(prev => [...prev, { text: data.message, cls }])
        }
        if (data.progress !== undefined) {
          setProgress(data.progress)
        }
        if (data.finding) {
          setFindings(prev => {
            if (prev.find(f => f.id === data.finding.id)) return prev
            return [...prev, data.finding]
          })
        }
      } catch {}
    })

    es.addEventListener('complete', (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.message) {
          setLines(prev => [...prev, { text: data.message }])
        }
        if (data.finding) {
          setFindings(prev => {
            if (prev.find(f => f.id === data.finding.id)) return prev
            return [...prev, data.finding]
          })
        }
      } catch {}
      setProgress(100)
      setIsComplete(true)
      es.close()
    })

    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [id])

  // Elapsed timer
  useEffect(() => {
    if (isComplete) return
    const i = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(i)
  }, [isComplete])

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [lines])

  const minutes = Math.floor(elapsed / 60)
  const seconds = (elapsed % 60).toString().padStart(2, '0')

  const displayTarget = targetUrl || '...'
  const displayType = scanType || 'Scanning'

  return (
    <div className="scan-shell">
      <div className="scan-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Wordmark size={16} />
          <span style={{ color: 'var(--border-2)' }}>·</span>
          <div className="scan-target">
            {isComplete ? null : <PulseDot />}
            {' '}
            {isComplete ? 'Scan complete' : 'Scanning'} <b className="mono">{displayTarget}</b>
            <span className="tag">{displayType}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="muted mono tabular" style={{ fontSize: 13 }}>{minutes}:{seconds} elapsed</span>
          <span className="muted" style={{ fontSize: 13 }}>·</span>
          <span className="muted" style={{ fontSize: 13 }}>Typically 3–8 minutes</span>
          {isComplete ? (
            <Link href={`/scan/${id}`} className="btn btn-primary btn-sm">
              View report <Icons.arrow />
            </Link>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => { esRef.current?.close(); router.push('/dashboard') }}>Cancel</button>
          )}
        </div>
      </div>

      <div className="scan-progress-bar" />

      <div className="scan-grid" style={{ flex: 1, height: 'calc(100vh - 97px)' }}>
        {/* Terminal */}
        <div ref={termRef} className="terminal">
          <div className="tline dim">$ invariant scan --target {displayTarget} {scanType === 'Authenticated scan' ? '--auth' : ''}</div>
          <div className="tline dim">{'  '}agent: invariant-1.4.2</div>
          <div className="tline dim" style={{ marginBottom: 14 }}>{'  '}{'─'.repeat(44)}</div>

          {lines.map((l, i) => (
            <div key={i} className={`tline ${l.cls || ''}`}>
              {l.text}
            </div>
          ))}

          {!isComplete && lines.length > 0 && <div className="tline"><span className="cursor" /></div>}

          {isComplete && (
            <>
              <div className="tline dim" style={{ marginTop: 14 }}>{'  '}{'─'.repeat(44)}</div>
              <div className="tline">
                → Scan complete.
                {findings.filter(f => f.severity === 'CRITICAL').length > 0 && ` ${findings.filter(f => f.severity === 'CRITICAL').length} critical ·`}
                {findings.filter(f => f.severity === 'HIGH').length > 0 && ` ${findings.filter(f => f.severity === 'HIGH').length} high ·`}
                {` ${findings.length} total finding${findings.length !== 1 ? 's' : ''}`}
              </div>
              <div className="tline dim">{'  '}Report ready: /scan/{id}</div>
            </>
          )}
        </div>

        {/* Live findings panel */}
        <div className="live-findings">
          <h3>
            Findings as we discover them
            <span className="count">{findings.length} found</span>
          </h3>

          {findings.length === 0 && (
            <div className="muted" style={{ fontSize: 13, padding: '24px 0' }}>
              Nothing yet. Findings will appear here in real time as the scan discovers them.
            </div>
          )}

          {findings.map(f => (
            <div key={f.id} className="live-finding">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Sev level={f.severity.toLowerCase()} />
                <span style={{ flex: 1 }} />
                <span className="muted mono" style={{ fontSize: 11 }}>just now</span>
              </div>
              <div className="t">{f.title}</div>
              <div className="d mt-8">{f.description.split('\n')[0]}</div>
            </div>
          ))}

          {!isComplete && findings.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 4px', color: 'var(--text-2)', fontSize: 13 }}>
              <PulseDot /> Still searching for more...
            </div>
          )}

          {isComplete && (
            <Link href={`/scan/${id}`} className="btn btn-primary" style={{ width: '100%', marginTop: 14 }}>
              Open full report <Icons.arrow />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
