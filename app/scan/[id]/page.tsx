'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { SeverityBadge, severityDot } from '@/components/ui/severity-badge'
import { FindingsList } from '@/components/ui/findings-list'
import { Scan, Finding } from '@/lib/store'
import { formatRelative } from '@/lib/utils'

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [scan, setScan] = useState<Scan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScan() {
      try {
        const res = await fetch(`/api/scans/${id}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setScan(data.scan || data) // Support both {scan} and direct object structures
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchScan()
  }, [id])

  const downloadReport = () => {
    if (!scan) return
    const reportData = {
      report_id: scan.id,
      target_url: scan.targetUrl,
      timestamp: scan.createdAt,
      findings: scan.findings.map(f => ({
        title: f.title,
        severity: f.severity,
        description: f.description,
        evidence: f.evidence,
        remediation: f.remediation,
      }))
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invariant-report-${scan.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
        <Navbar />
        <div className="flex items-center justify-center h-screen font-mono text-sm text-zinc-500">
          Syncing report data...
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-zinc-500 mb-6 font-mono text-sm uppercase tracking-widest">Report not found</p>
          <Link href="/dashboard" className="text-xs font-mono text-[#00D97E] hover:underline uppercase tracking-widest">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-8 pt-32 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/dashboard" className="text-[10px] font-mono text-zinc-600 hover:text-[#00D97E] transition-colors border border-zinc-900 px-2 py-1 uppercase tracking-widest">
                DASHBOARD
              </Link>
              <span className="text-zinc-800">/</span>
              <span className="text-[10px] font-mono text-zinc-600 border border-zinc-900 px-2 py-1 uppercase tracking-widest">REPORTS</span>
              <span className="text-zinc-800">/</span>
              <span className="text-[10px] font-mono text-[#00D97E] border border-[#00D97E]/20 px-2 py-1 uppercase tracking-widest">LIVE</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {scan.targetUrl}
            </h1>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-650 uppercase tracking-widest">Scan ID</span>
                <span className="text-xs font-mono text-zinc-400">{scan.id}</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-650 uppercase tracking-widest">Completed</span>
                <span className="text-xs font-mono text-zinc-400">{formatRelative(scan.createdAt)}</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-650 uppercase tracking-widest">Depth</span>
                <span className="text-xs font-mono text-zinc-400 capitalize">{scan.depth}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={downloadReport}
              className="px-6 py-3 border border-zinc-800 bg-[#0f0f14] text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-600 transition-all uppercase tracking-widest"
            >
              Download Report
            </button>
            <Link 
              href="/scan/new"
              className="px-6 py-3 bg-[#00D97E] text-white text-xs font-bold hover:brightness-110 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(0,217,126,0.2)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Re-Scan Target
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatBox label="Critical" count={scan.findings?.filter(f => f.severity === 'CRITICAL').length || 0} color="bg-red-500" />
          <StatBox label="High" count={scan.findings?.filter(f => f.severity === 'HIGH').length || 0} color="bg-orange-500" />
          <StatBox label="Medium" count={scan.findings?.filter(f => f.severity === 'MEDIUM').length || 0} color="bg-yellow-500" />
          <StatBox label="Low" count={scan.findings?.filter(f => f.severity === 'LOW').length || 0} color="bg-blue-500" />
        </div>

        {/* Findings Section */}
        <div className="grid grid-cols-1 gap-12">
          <section>
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
              <h2 className="text-sm font-mono uppercase tracking-widest text-[#00D97E]">Vulnerability Analysis</h2>
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                Showing {scan.findings.length} findings
              </span>
            </header>

            <FindingsList findings={scan.findings?.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH' || f.severity === 'MEDIUM' || f.severity === 'LOW') as any} />
          </section>

          {/* Contact Admin Footer */}
          <footer className="mt-20 pt-12 border-t border-zinc-900 text-center">
            <div className="inline-block px-12 py-8 bg-[#0f0f14] border border-dashed border-zinc-800 rounded-sm">
              <p className="text-zinc-500 text-sm mb-3">Note: This report covers Level 1 autonomous security analysis.</p>
              <p className="text-xs font-mono text-zinc-650 uppercase tracking-widest leading-relaxed">
                To add more depth or customized findings, <br className="hidden md:block" />
                please contact the administrator.
              </p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}

function StatBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-[#0f0f14] border border-zinc-800 p-6 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-full h-0.5 ${color} opacity-30 group-hover:opacity-100 transition-opacity`} />
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${color} ${count > 0 ? 'animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'opacity-20'}`} />
      </div>
      <div className="text-4xl font-bold mt-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {count}
      </div>
    </div>
  )
}