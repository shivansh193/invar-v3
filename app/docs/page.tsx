import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'

export default function DocsPage() {
  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-8 pt-40 pb-32 grid grid-cols-1 md:grid-cols-4 gap-20">
        <aside className="md:col-span-1 space-y-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest border-b border-zinc-800 pb-2">Getting Started</h3>
            <ul className="space-y-2 text-xs font-mono uppercase tracking-widest text-[#00D97E]">
              <li><Link href="#">Introduction</Link></li>
              <li className="text-zinc-600"><Link href="#">Quickstart</Link></li>
              <li className="text-zinc-600"><Link href="#">Scan Typs</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest border-b border-zinc-800 pb-2">Advanced</h3>
            <ul className="space-y-2 text-xs font-mono uppercase tracking-widest text-zinc-600">
              <li><Link href="#">CI/CD Pipeline</Link></li>
              <li><Link href="#">API Docs</Link></li>
              <li><Link href="#">Auth Flows</Link></li>
            </ul>
          </div>
        </aside>

        <section className="md:col-span-3 space-y-12">
          <div>
            <span className="font-mono text-xs text-[#00D97E] uppercase tracking-[0.2em] mb-4 block">Documentation</span>
            <h1
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-5xl font-bold text-white uppercase tracking-tight mb-8"
            >
              Introduction
            </h1>
            <p className="text-zinc-500 text-lg leading-relaxed mb-6">
              Invariant is an autonomous security testing platform designed to run deep-traversal vulnerability scans on web applications. Unlike traditional scanners, Invariant uses an LLM-driven agent to reason about application logic.
            </p>
          </div>

          <div className="space-y-6">
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-bold text-white uppercase tracking-tight">Core Concepts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocCard 
                title="Reasoning Engine"
                body="Our engine doesn't just crawl; it thinks. It makes decisions based on what it observes in the browser."
              />
              <DocCard 
                title="Verified Findings"
                body="Zero noise. Every vulnerability is confirmed with an automated PoC."
              />
            </div>
          </div>
          
          <div className="bg-[#1f1f25] p-10 border border-zinc-800">
             <h3 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-white uppercase tracking-tight mb-4 text-center">Ready to start?</h3>
             <div className="flex justify-center">
               <Link
                href="/scan/new"
                className="inline-block bg-[#00D97E] text-white font-bold px-10 py-4 uppercase tracking-tighter hover:brightness-110 transition-all text-sm"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Launch Initial Scan →
              </Link>
             </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function DocCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-zinc-800 p-6 hover:border-[#00D97E]/30 transition-colors">
      <h3 className="font-mono text-white text-sm uppercase tracking-widest mb-3">{title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed">{body}</p>
    </div>
  )
}
