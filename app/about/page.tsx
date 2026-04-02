import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'

export default function AboutPage() {
  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-8 pt-40 pb-32">
        <div className="mb-16">
          <span className="font-mono text-xs text-[#00D97E] uppercase tracking-[0.2em] mb-4 block">Our Story</span>
          <h1
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-5xl md:text-6xl font-bold text-white uppercase tracking-tight mb-8"
          >
            Why Invariant?
          </h1>
          <p className="text-zinc-500 text-xl leading-relaxed">
            Existing security tools are broken. ZAP and Burp are powerful but require manual expertise. Modern DAST tools are often just glorified scrapers that miss complex business logic flaws.
          </p>
        </div>

        <div className="space-y-20">
          <Section 
            title="The Problem"
            body="Security teams are outnumbered. For every 100 developers, there is often only one security engineer. Manual penetration testing doesn't scale, and automated scanners produce too much noise."
          />
          <Section 
            title="Our Solution"
            body="We built an autonomous security agent that thinks like a human attacker but works at machine scale. Invariant doesn't just crawl URLs—it interprets your application's logic, understands user roles, and attempts complex multi-step exploits."
          />
          <Section 
            title="The Difference"
            body="Zero noise. Every finding in an Invariant report is verified with an automated proof-of-concept. If we say it's a vulnerability, we've already exploited it."
          />
        </div>

        <div className="mt-32 pt-20 border-t border-zinc-800/50 text-center">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-3xl font-bold text-white uppercase tracking-tight mb-8">Ready to secure your app?</h2>
          <Link
            href="/scan/new"
            className="inline-block bg-[#00D97E] text-white font-bold px-12 py-5 text-lg uppercase tracking-tighter hover:brightness-110 transition-all"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Launch Initial Scan →
          </Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-white uppercase tracking-tight">
        {title}
      </h2>
      <p className="md:col-span-2 text-zinc-500 leading-relaxed">
        {body}
      </p>
    </div>
  )
}
