'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { SeverityBadge, severityDot } from '@/components/ui/severity-badge'
import { Scan } from '@/lib/store'
import { formatRelative, formatDuration } from '@/lib/utils'

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScans() {
      try {
        const res = await fetch('/api/scans')
        const data = await res.json()
        setScans(data.scans || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchScans()
  }, [])

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 pt-32 pb-20">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard" className="text-xs font-mono text-zinc-500 hover:text-[#00D97E] transition-colors">
              DASHBOARD
            </Link>
            <span className="text-zinc-800">/</span>
            <span className="text-xs font-mono text-[#00D97E]">AUDIT HISTORY</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Audit History
          </h1>
        </header>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 font-mono text-sm text-zinc-600">Retrieving audit trail...</div>
          ) : scans.length === 0 ? (
            <div className="text-center py-20 border border-zinc-800 border-dashed rounded-lg">
              <p className="text-zinc-500 text-sm mb-4">No scan history recorded in this session.</p>
              <Link 
                href="/scan/new"
                className="bg-[#00D97E] text-white font-bold px-8 py-3 text-sm uppercase tracking-tighter hover:brightness-110 transition-all"
              >
                Scan Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest border-b border-zinc-800/50">
                <div className="col-span-5">Target / ID</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Findings</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
              {scans.map((scan) => (
                <HistoryRow key={scan.id} scan={scan} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HistoryRow({ scan }: { scan: Scan }) {
  return (
    <div className="grid grid-cols-12 px-6 py-5 bg-[#0f0f14] border border-zinc-800 hover:border-zinc-700 hover:bg-white/[0.02] transition-all group">
      <div className="col-span-5 flex flex-col justify-center">
        <Link href={`/scan/${scan.id}`} className="text-sm font-medium hover:text-[#00D97E] transition-colors truncate pr-4">
          {scan.targetUrl}
        </Link>
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-1">
          {scan.id}
        </span>
      </div>
      <div className="col-span-2 flex items-center">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${scan.status === 'complete' ? 'bg-[#00D97E]' : 'bg-yellow-500'}`} />
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
            {scan.status}
          </span>
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-3">
        {scan.findings.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white">{scan.findings.length}</span>
            {scan.findings.some(f => f.severity === 'CRITICAL') && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Critical Findings Present" />
            )}
          </div>
        ) : (
          <span className="text-xs font-mono text-zinc-700">0</span>
        )}
      </div>
      <div className="col-span-2 flex items-center">
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          {formatRelative(scan.createdAt)}
        </span>
      </div>
      <div className="col-span-1 flex items-center justify-end">
        <Link 
          href={scan.status === 'complete' ? `/scan/${scan.id}` : `/scan/${scan.id}/progress`}
          className="text-[10px] font-mono text-zinc-400 group-hover:text-[#00D97E] transition-colors uppercase tracking-widest"
        >
          {scan.status === 'complete' ? 'VIEW' : 'RESUME'} →
        </Link>
      </div>
    </div>
  )
}
