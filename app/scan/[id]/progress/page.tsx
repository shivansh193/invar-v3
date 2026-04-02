'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { ScanProgressEvent, Finding } from '@/lib/types'

const SIMULATED_STEPS = [
  { message: 'Initializing autonomous agent...', delay: 800 },
  { message: 'Booting Chromium with headless rendering...', delay: 1500 },
  { message: 'Crawl: Navigating to landing page...', delay: 2500 },
  { message: 'Crawl: Discovered 4 internal routes via link analysis.', delay: 3500 },
  { message: 'Crawl: Mapping state transitions for unauthenticated flows.', delay: 4800 },
  { message: 'Test: Executing cross-site scripting (XSS) polyglots on search...', delay: 6500 },
  { message: 'Test: Probing for sensitive information disclosure in headers...', delay: 8000 },
  { message: '[INFO] Found 142 unique endpoints via deep crawling.', delay: 9500 },
  { message: 'Test: Checking JWT signature validation and alg confusion...', delay: 11000 },
  { message: 'Test: Probing API endpoints with parameter mutations...', delay: 13000 },
  { message: 'Test: Checking for IDOR vulnerabilities on primary resource IDs...', delay: 15000 },
  { message: 'Test: Analyzing session cookie security and persistence...', delay: 17000 },
  { message: 'Finalizing security audit and finding verification...', delay: 19000 },
  { message: 'Scan complete. Compiling executive summary...', delay: 20500 },
]

export default function ScanProgressPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.id as string

  const [scan, setScan] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [earlyFindings, setEarlyFindings] = useState<Partial<Finding>[]>([])
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    // Fetch scan details to get the target URL
    const fetchScan = async () => {
      try {
        const res = await fetch(`/api/scans/${scanId}`)
        const data = await res.json()
        if (data.scan) setScan(data.scan)
      } catch (err) {
        console.error('Failed to fetch scan:', err)
      }
    }
    fetchScan()

    // Use SSE for real-time progress
    const eventSource = new EventSource(`/api/scans/${scanId}/progress`)
    
    eventSource.onmessage = (e) => {
      const event = JSON.parse(e.data)
      if (event.message) setLogs((prev) => [...prev, event.message])
      if (event.progress) setProgress(event.progress)
      if (event.finding) setEarlyFindings((prev) => [...prev, event.finding])
    }

    eventSource.addEventListener('complete', () => {
      eventSource.close()
      setIsComplete(true)
      setTimeout(() => router.push(`/scan/${scanId}`), 2000)
    })

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err)
      eventSource.close()
    }

    return () => eventSource.close()
  }, [scanId, router])

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-8 pt-32 pb-20">
        <div className="mb-12 border-b border-zinc-800 pb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {!isComplete ? (
                <div className="relative w-3 h-3">
                  <span className="absolute inset-0 bg-[#00D97E] rounded-full animate-ping opacity-40" />
                  <span className="relative block w-3 h-3 bg-[#00D97E] rounded-full" />
                </div>
              ) : (
                <span className="w-3 h-3 bg-[#00D97E] rounded-full" />
              )}
              <h1
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="text-3xl font-bold text-white uppercase tracking-tight"
              >
                {isComplete ? 'Scan Complete' : 'Scan in Progress'}
              </h1>
            </div>
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest border border-zinc-800 px-3 py-1">
              ID: {scanId}
            </div>
          </div>
          <p className="text-zinc-500 font-mono text-xs mt-2 max-w-xl leading-relaxed">
            {isComplete 
              ? 'Results are ready. Redirecting you to the final report summary.' 
              : 'Our agent is interacting with your application logic in real-time. Findings are validated with proof-of-concept before being surfaced.'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Progress</span>
            <span className="text-xs font-mono text-[#00D97E]">{progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1">
            <div
              className="h-1 bg-[#00D97E] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Terminal log */}
          <div className="bg-[#0f0f14] border border-zinc-800">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Agent Log</span>
              <span className="text-[10px] font-mono text-[#00D97E]/60">
                {isComplete ? '● DONE' : '● LIVE'}
              </span>
            </div>
            <div className="p-4 font-mono text-xs text-zinc-500 space-y-1.5 h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    log.includes('[CRITICAL]')
                      ? 'text-red-400'
                      : log.includes('[HIGH]')
                      ? 'text-orange-400'
                      : log.includes('[SUCCESS]') || log.includes('complete')
                      ? 'text-[#00D97E]'
                      : 'text-zinc-500'
                  }`}
                >
                  <span className="text-[#00D97E]/40 flex-shrink-0">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              {!isComplete && (
                <div className="flex gap-2 text-zinc-600">
                  <span className="text-[#00D97E]/40">&gt;</span>
                  <span className="animate-pulse">_</span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Early findings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Early Findings</span>
              {earlyFindings.length > 0 && (
                <span className="text-xs font-mono text-[#00D97E]">{earlyFindings.length} found</span>
              )}
            </div>
            <div className="space-y-3">
              {earlyFindings.length === 0 ? (
                <div className="border border-zinc-800 px-5 py-8 text-center">
                  <p className="text-zinc-600 font-mono text-xs">No findings yet...</p>
                </div>
              ) : (
                earlyFindings.map((f, i) => (
                  <div key={i} className="border border-zinc-800 bg-[#1f1f25] px-4 py-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <SeverityBadge severity={f.severity!} size="sm" />
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{f.category}</span>
                    </div>
                    <p className="text-sm text-zinc-300 font-medium mb-1">{f.title}</p>
                    {f.endpoint && (
                      <p className="text-xs font-mono text-zinc-600 truncate">{f.endpoint}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {isComplete && (
              <div className="mt-4 bg-[#00D97E]/5 border border-[#00D97E]/30 px-4 py-3">
                <p className="text-xs font-mono text-[#00D97E]">✓ Scan complete — redirecting to full report...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}