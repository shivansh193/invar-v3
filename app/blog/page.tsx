import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'

const POSTS = [
  {
    date: 'Mar 28, 2024',
    title: 'The Fall of Simple Scanners',
    excerpt: 'Why traditional DAST tools are failing to find business logic flaws in modern SPAs.',
    category: 'Analysis'
  },
  {
    date: 'Mar 15, 2024',
    title: 'Autonomous Security Agents',
    excerpt: 'How LLMs are revolutionizing the way we think about vulnerability research.',
    category: 'Technology'
  },
  {
    date: 'Feb 29, 2024',
    title: 'Exploiting JWT Confusion',
    excerpt: 'A deep dive into how our agent found a critical bypass in a major SaaS platform.',
    category: 'Vulnerability Study'
  }
]

export default function BlogPage() {
  return (
    <div className="bg-[#0A0A0F] min-h-screen text-[#e4e1e9]">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-8 pt-40 pb-32">
        <div className="mb-20">
          <span className="font-mono text-xs text-[#00D97E] uppercase tracking-[0.2em] mb-4 block">Security Intelligence</span>
          <h1
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-5xl md:text-6xl font-bold text-white uppercase tracking-tight mb-6"
          >
            Terminal Blog
          </h1>
          <p className="text-zinc-500 text-xl max-w-2xl">
            Vulnerability writeups, product updates, and technical deep-dives into autonomous security testing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {POSTS.map((post) => (
            <div key={post.title} className="group cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-mono text-[#00D97E] border border-[#00D97E]/30 px-2 py-0.5 uppercase tracking-widest">{post.category}</span>
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{post.date}</span>
              </div>
              <h2
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-[#00D97E] transition-colors mb-4"
              >
                {post.title}
              </h2>
              <p className="text-zinc-500 leading-relaxed mb-6">
                {post.excerpt}
              </p>
              <span className="text-xs font-mono text-white group-hover:translate-x-2 transition-transform inline-block uppercase tracking-widest font-bold">Read Post →</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
