'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Scan } from '@/lib/store'
import { formatRelative } from '@/lib/utils'

function DashboardContent() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const upgraded = searchParams.get('upgraded') === 'true'

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

  const totalScans = scans.length
  const totalFindings = scans.reduce((acc, s) => acc + (s.findings?.length || 0), 0)
  const criticalFindings = scans.reduce((acc, s) =>
    acc + (s.findings?.filter(f => f.severity === 'CRITICAL').length || 0), 0
  )

  const baseScore = 100
  const penalty = (criticalFindings * 15) + (totalFindings * 5)
  const score = Math.max(0, baseScore - penalty)

  return (
    <main className="max-w-7xl mx-auto px-8 pt-32 pb-20">
        {upgraded && (
          <div className="mb-8 bg-[#00D97E]/10 border border-[#00D97E]/30 px-6 py-4 flex items-center justify-between">
            <p className="text-sm font-mono text-[#00D97E]">
              ✓ Welcome to Growth — authenticated scans and advanced features are now unlocked.
            </p>
            <Link
              href="/dashboard"
              replace
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-widest"
            >
              Dismiss
            </Link>
          </div>
        )}

        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Security Dashboard
          </h1>
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">
            Real-time attack surface monitoring
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Security Posture"
            value={`${score}/100`}
            sub="Based on active findings"
            color={score > 80 ? 'text-[#00D97E]' : score > 50 ? 'text-yellow-400' : 'text-red-500'}
          />
          <StatCard label="Total Scans" value={totalScans.toString()} sub="Lifetime active" />
          <StatCard label="Open Findings" value={totalFindings.toString()} sub="Requires attention" />
          <StatCard
            label="Critical Risk"
            value={criticalFindings.toString()}
            sub="Immediate action"
            color="text-red-500"
          />
        </div>

        {/* Recent Scans Table */}
        <div className="bg-[#0f0f14] border border-zinc-800 rounded-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-400">Recent Activity</h2>
            <Link href="/history" className="text-[10px] font-mono text-[#00D97E] hover:underline uppercase tracking-widest">
              View all history →
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {loading ? (
              <div className="p-12 text-center text-zinc-600 font-mono text-xs">Loading activity...</div>
            ) : scans.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-zinc-500 text-sm mb-4">No recent scans found.</p>
                <Link
                  href="/scan/new"
                  className="inline-block bg-[#00D97E] text-white font-bold px-6 py-2 text-xs uppercase tracking-tighter hover:brightness-110 transition-all"
                >
                  Start your first scan
                </Link>
              </div>
            ) : (
              scans.slice(0, 5).map((scan) => (
                <div key={scan.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={scan.status === 'complete' ? 'text-[#00D97E]' : 'text-yellow-500'}>
                      <span className="text-[10px] font-mono border border-current px-1.5 py-0.5 uppercase">
                        {scan.status}
                      </span>
                    </div>
                    <div>
                      <Link href={`/scan/${scan.id}`} className="text-sm font-medium hover:text-[#00D97E] transition-colors block">
                        {scan.targetUrl}
                      </Link>
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                        {scan.id} • {formatRelative(scan.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs font-mono text-zinc-400">{scan.findings.length} findings</div>
                      <div className="text-[9px] font-mono text-zinc-600 uppercase">
                        {scan.findings.filter(f => f.severity === 'CRITICAL').length} critical
                      </div>
                    </div>
                    <Link
                      href={scan.status === 'complete' ? `/scan/${scan.id}` : `/scan/${scan.id}/progress`}
                      className="text-xs font-mono text-zinc-500 group-hover:text-white transition-colors"
                    >
                      DETAILS →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      <Suspense fallback={<div className="max-w-7xl mx-auto px-8 pt-32 pb-20 font-mono text-xs text-zinc-500">Loading dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; subText?: string; color?: string; sub: string }) {
  return (
    <div className="bg-[#0f0f14] border border-zinc-800 p-6 rounded-sm">
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">{label}</div>
      <div className={`text-3xl font-bold mb-1 ${color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {value}
      </div>
      <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{sub}</div>
    </div>
  )
}
