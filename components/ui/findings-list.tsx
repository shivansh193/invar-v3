'use client'

import { useState } from 'react'
import { SeverityBadge } from './severity-badge'
import { Finding } from '@/lib/store'
import { ChevronDown, ChevronUp, AlertTriangle, ShieldCheck } from 'lucide-react'

export function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <div className="text-center py-20 border border-zinc-900 bg-zinc-950/20">
        <ShieldCheck className="w-12 h-12 text-[#00D97E] mx-auto mb-4 opacity-50" />
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">No vulnerabilities found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {findings.map((finding) => (
        <FindingItem key={finding.id} finding={finding} />
      ))}
    </div>
  )
}

function FindingItem({ finding }: { finding: Finding }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-[#0f0f14] border border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <div className="flex items-center gap-6">
          <SeverityBadge severity={finding.severity as any} />
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-[#00D97E] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {finding.title}
            </h3>
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              {finding.id} • {finding.severity} SEVERITY
            </span>
          </div>
        </div>
        <div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-zinc-800/50 bg-black/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-orange-500" /> Description
                </h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {finding.description}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Remediation</h4>
                <div className="bg-[#00D97E]/5 border border-[#00D97E]/10 p-4">
                  <p className="text-sm text-[#00D97E]/80 leading-relaxed font-mono">
                    {finding.remediation}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Evidence</h4>
              <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-sm font-mono text-xs text-zinc-500 whitespace-pre-wrap break-all h-full max-h-[220px] overflow-y-auto">
                {finding.evidence}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
