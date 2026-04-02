'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { MOCK_SCAN } from '@/lib/mock-data'

export default function LandingPage() {
  const [url, setUrl] = useState('')

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar variant="transparent" />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-8 pt-48 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 border border-[#00D97E]/20 bg-[#00D97E]/5 px-3 py-1.5">
                <span className="w-1.5 h-1.5 bg-[#00D97E] rounded-full animate-pulse" />
                <span className="text-[#00D97E] font-mono text-xs tracking-widest uppercase">Now in public beta</span>
              </div>
              <h1
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="text-6xl md:text-7xl font-medium text-[#F1F0F5] leading-[1.2] tracking-tight"
              >
                Find what your scanner misses.
              </h1>
              <p className="text-xl text-zinc-500 max-w-xl leading-relaxed">
                Invariant logs into your product and explores it like a real attacker — not a script.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-0 max-w-lg">
              <input
                id="hero-url-input"
                className="flex-grow bg-[#0A0A0F] border-0 border-b-2 border-zinc-700 focus:border-[#00D97E] focus:ring-0 text-white font-mono px-4 py-4 text-sm transition-colors outline-none"
                placeholder="your-app-url.com"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                onClick={async () => {
                  const urlInput = document.getElementById('hero-url-input') as HTMLInputElement;
                  const url = urlInput.value;
                  if (!url) return;
                  
                  try {
                    const res = await fetch('/api/scans', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetUrl: url, type: 'unauthenticated', depth: 'quick' })
                    });
                    const data = await res.json();
                    if (data.id) window.location.href = `/scan/${data.id}/progress`;
                  } catch (err) {
                    window.location.href = `/scan/new?url=${encodeURIComponent(url)}`;
                  }
                }}
                className="bg-[#00D97E] text-white font-bold px-8 py-4 flex items-center justify-center gap-2 hover:brightness-110 transition-all uppercase tracking-tighter whitespace-nowrap text-sm"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Scan for free →
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A0A0F] bg-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-500 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest leading-tight">
                Trusted by security teams at<br />
                <span className="text-zinc-400">Vercel · Anthropic · Supabase</span>
              </p>
            </div>
          </div>

          {/* Terminal */}
          <div className="relative">
            <div className="absolute -inset-4 bg-[#00D97E]/3 blur-3xl" />
            <div className="relative bg-[#0A0A0F] border border-zinc-800 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-[#0f0f14]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-zinc-700 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-zinc-700 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-zinc-700 rounded-full" />
                </div>
                <span className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">invariant_shell_v4.2</span>
                <span className="text-[10px] font-mono text-[#00D97E]/60">● LIVE</span>
              </div>
              <div className="p-6 font-mono text-xs leading-relaxed text-zinc-500 min-h-[380px]">
                <TerminalLine prompt>initializing_autonomous_agent...</TerminalLine>
                <TerminalLine prompt>target: https://api.production-environment.io</TerminalLine>
                <TerminalLine prompt>status: crawling deep-link structures...</TerminalLine>
                <div className="mt-5 pl-4 border-l-2 border-[#00D97E]/20 space-y-1.5">
                  <div className="text-zinc-600">[INFO] Found 142 unique endpoints</div>
                  <div className="text-zinc-600">[INFO] Testing authorization persistence...</div>
                  <div className="text-zinc-600">[INFO] Checking JWT signature bypass...</div>
                  <div className="text-[#00D97E] font-medium mt-2">
                    [SUCCESS] Bypassed secondary auth layer via parameter pollution
                  </div>
                  <div className="bg-red-900/20 text-red-400 border border-red-500/20 px-2 py-1 inline-block my-2 font-bold text-[11px]">
                    [CRITICAL] UNAUTHORIZED DATA EXFILTRATION DETECTED
                  </div>
                  <div className="text-zinc-500">→ Vector: /v2/internal/customer_records?id=9921</div>
                  <div className="text-zinc-500">→ Severity: 9.8 CVSS</div>
                  <div className="text-zinc-500">→ Affected users: all (no auth check)</div>
                </div>
                <div className="mt-6 flex gap-3">
                  <span className="text-[#00D97E]">&gt;</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-800/30 py-16">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '99.8%', label: 'Detection Rate' },
              { value: '1.2M', label: 'Exploits Blocked' },
              { value: '< 5min', label: 'Setup Time' },
              { value: '24/7', label: 'Autonomous Ops' },
            ].map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="font-mono text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample Report Section */}
        <section className="max-w-7xl mx-auto px-8 py-32 bg-[#00D97E]/[0.02] border-y border-zinc-800/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="font-mono text-xs text-[#00D97E] uppercase tracking-widest mb-4 block">The Product is the Report</span>
              <h2
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="text-4xl font-bold text-white uppercase tracking-tight mb-6"
              >
                A report you can actually read and act on.
              </h2>
              <p className="text-zinc-500 text-lg leading-relaxed mb-8">
                No more 400-page PDFs. Get a clean, interactive breakdown of every finding with clear business impact and one-click reproduction steps for your developers.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  'Sort by severity, category, or effort to fix',
                  'One-click mark as fixed & automated rescan',
                  'Executive summary for C-level reporting',
                  'Interactive proof-of-concept for every finding'
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="text-[#00D97E]">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/scan/scan_demo"
                className="inline-block border border-[#00D97E] text-[#00D97E] font-bold px-8 py-4 uppercase tracking-tighter hover:bg-[#00D97E] hover:text-white transition-all text-sm"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                See a Live Sample Report
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-[#00D97E]/5 blur-2xl group-hover:bg-[#00D97E]/10 transition-all" />
              <div className="relative bg-[#0f0f14] border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#16161c]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-500">Demo Application</span>
                    <SeverityBadge severity="high" />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-bold text-white">Bypass Secondary Auth Layer</h4>
                    <span className="text-red-400 font-mono text-xs">CRITICAL</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 bg-zinc-800 rounded w-full" />
                    <div className="h-2 bg-zinc-800 rounded w-[90%]" />
                    <div className="h-2 bg-zinc-800 rounded w-[40%]" />
                  </div>
                  <div className="pt-6 border-t border-zinc-800/50 flex gap-4">
                    <div className="flex-1 space-y-2">
                       <div className="text-[10px] font-mono text-zinc-600 uppercase">Impact</div>
                       <div className="h-1.5 bg-zinc-800 rounded w-full" />
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="text-[10px] font-mono text-zinc-600 uppercase">Fix Effort</div>
                       <div className="h-1.5 bg-zinc-800 rounded w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="max-w-7xl mx-auto px-8 py-32">
          <div className="text-center mb-20">
            <h2
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-4xl font-bold text-white uppercase tracking-tight"
            >
              Start scanning for free
            </h2>
            <p className="text-zinc-500 mt-4 max-w-xl mx-auto">
              Simple pricing that scales with your security needs. No long-term contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-[#1f1f25] border border-zinc-800 p-10 flex flex-col items-center text-center">
              <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-2">Individual</span>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-bold text-white mb-6">Community</h3>
              <div className="text-5xl font-bold text-white mb-8">$0<span className="text-lg text-zinc-600 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-12 text-zinc-500 text-sm">
                <li>Unauthenticated public scans</li>
                <li>OWASP Top 10 coverage</li>
                <li>Standard email support</li>
                <li className="text-zinc-700 strike-through line-through">Automated fix verification</li>
              </ul>
              <Link
                href="/scan/new"
                className="w-full border border-zinc-700 text-white font-bold py-4 uppercase tracking-tighter hover:border-[#00D97E] transition-colors text-sm"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Scan Now →
              </Link>
            </div>

            {/* Paid */}
            <div className="bg-[#00D97E]/5 border border-[#00D97E]/30 p-10 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#00D97E] text-white text-[9px] font-bold px-8 py-1 rotate-45 translate-x-4 translate-y-3 uppercase tracking-tighter">Recommended</div>
              <span className="font-mono text-xs text-[#00D97E] uppercase tracking-widest mb-2">Enterprise</span>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-bold text-white mb-6">Growth</h3>
              <div className="text-5xl font-bold text-white mb-8">$490<span className="text-lg text-zinc-600 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-12 text-zinc-400 text-sm">
                <li>Authenticated user flow testing</li>
                <li>Business logic vulnerability detection</li>
                <li>CI/CD pipeline integration</li>
                <li>24/7 Priority engineer support</li>
              </ul>
              <Link
                href="/signup"
                className="w-full bg-[#00D97E] text-white font-bold py-4 uppercase tracking-tighter hover:brightness-110 transition-all text-sm"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Get Started →
              </Link>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/pricing" className="text-xs font-mono text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">
              View full comparison table →
            </Link>
          </div>
        </section>

        {/* vs competitors */}
        <section className="max-w-7xl mx-auto px-8 py-16">
          <div className="border border-zinc-800 p-px">
            <div className="bg-[#0f0f14] p-10">
              <div className="mb-8">
                <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Differentiation</span>
                <h3
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  className="text-2xl font-bold text-white mt-2"
                >
                  What existing tools miss
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-zinc-500 py-3 pr-8 uppercase text-xs tracking-widest font-normal">
                        Capability
                      </th>
                      <th className="text-center text-zinc-500 py-3 px-6 uppercase text-xs tracking-widest font-normal">
                        OWASP ZAP
                      </th>
                      <th className="text-center text-zinc-500 py-3 px-6 uppercase text-xs tracking-widest font-normal">
                        Burp Suite
                      </th>
                      <th className="text-center text-[#00D97E] py-3 px-6 uppercase text-xs tracking-widest font-normal">
                        Invariant
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Authenticated user flows', false, true, true],
                      ['Cross-user IDOR detection', false, false, true],
                      ['Business logic flaws', false, false, true],
                      ['Feature entitlement bypass', false, false, true],
                      ['SQL injection & XSS', true, true, true],
                      ['Reproducible PoC for every finding', false, false, true],
                      ['Runs autonomously, no human', false, false, true],
                    ].map(([cap, zap, burp, inv]) => (
                      <tr key={String(cap)} className="border-b border-zinc-800/50">
                        <td className="py-3 pr-8 text-zinc-400">{String(cap)}</td>
                        <td className="py-3 px-6 text-center">{zap ? '✓' : <span className="text-zinc-700">—</span>}</td>
                        <td className="py-3 px-6 text-center">{burp ? '✓' : <span className="text-zinc-700">—</span>}</td>
                        <td className="py-3 px-6 text-center text-[#00D97E] font-bold">{inv ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Bento */}
        <section className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[280px]">
            <div className="md:col-span-8 bg-[#1f1f25] p-10 flex flex-col justify-end group hover:bg-[#252530] transition-colors">
              <span className="font-mono text-zinc-600 text-xs tracking-widest uppercase mb-auto block">
                Security Engine
              </span>
              <div>
                <h4
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  className="text-2xl font-bold mb-3 text-white"
                >
                  Real-time attack simulation.
                </h4>
                <p className="text-zinc-500 max-w-md text-sm leading-relaxed">
                  Continuously stress-test your production environment with thousands of mutated payloads tailored to your tech stack.
                </p>
              </div>
            </div>
            <div className="md:col-span-4 bg-[#00D97E] p-10 flex flex-col justify-end text-white">
              <span className="text-4xl mb-auto block">⌥</span>
              <div>
                <h4 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold mb-2">CI/CD Ready</h4>
                <p className="text-white/80 text-sm">Integrate directly into your deployment pipeline. Exit non-zero on critical findings.</p>
              </div>
            </div>
            <div className="md:col-span-4 bg-[#2a292f] p-10 flex flex-col justify-end">
              <span className="text-4xl text-zinc-600 mb-auto block">◎</span>
              <div>
                <h4 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold mb-2 text-white">Zero Access</h4>
                <p className="text-zinc-500 text-sm">No source code required. We test the binary reality of your app.</p>
              </div>
            </div>
            <div className="md:col-span-8 bg-[#0A0A0F] border border-zinc-800/50 p-10 flex flex-col justify-center items-center text-center">
              <h4
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="text-3xl font-bold mb-6 text-white"
              >
                Scale your security team<br />by 100x.
              </h4>
              <Link
                href="/scan/new"
                className="bg-[#00D97E] text-white font-bold px-10 py-3.5 uppercase tracking-tighter text-sm hover:brightness-110 transition-all"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Deploy Invariant
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40">
          <div className="max-w-3xl mx-auto px-8 text-center space-y-8">
            <h2
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-5xl md:text-6xl font-bold tracking-tighter uppercase text-white"
            >
              Ready to close the gap?
            </h2>
            <p className="text-zinc-500 text-lg">
              Get a comprehensive security audit report in minutes. No credit card required, no sales calls needed.
            </p>
            <div className="pt-4">
              <Link
                href="/scan/new"
                className="inline-block bg-[#00D97E] text-white font-bold px-12 py-5 text-lg uppercase tracking-tighter hover:brightness-110 transition-all"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Launch Initial Scan →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-10 max-w-7xl mx-auto">
          <div className="font-mono font-bold text-lg mb-6 md:mb-0 flex items-center gap-1">
            <span className="text-[#00D97E]">&gt;_</span>
            <span className="text-white">INVARIANT</span>
          </div>
          <div className="flex gap-8 mb-6 md:mb-0">
            {['Privacy', 'Terms', 'Security', 'Status', 'Responsible Disclosure'].map((l) => (
              <Link
                key={l}
                href="#"
                className="text-zinc-600 font-mono text-[10px] tracking-widest uppercase hover:text-[#00D97E] transition-colors"
              >
                {l}
              </Link>
            ))}
          </div>
          <div className="text-zinc-600 font-mono text-[10px] tracking-widest uppercase">
            © 2024 Invariant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function TerminalLine({ children, prompt }: { children: React.ReactNode; prompt?: boolean }) {
  return (
    <div className="flex gap-3 mb-1.5">
      {prompt && <span className="text-[#00D97E] select-none">&gt;</span>}
      <span>{children}</span>
    </div>
  )
}