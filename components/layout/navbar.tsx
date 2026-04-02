'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavbarProps {
  variant?: 'transparent' | 'dark'
}

export function Navbar({ variant = 'dark' }: NavbarProps) {
  const pathname = usePathname()
  const isApp = pathname.startsWith('/dashboard') || pathname.startsWith('/scan') || pathname.startsWith('/history') || pathname.startsWith('/settings')

  return (
    <nav
      className={cn(
        'fixed top-0 w-full z-50 border-b transition-all duration-300',
        variant === 'transparent'
          ? 'bg-transparent border-transparent'
          : 'bg-[#0A0A0F]/90 backdrop-blur-sm border-zinc-800/30'
      )}
    >
      <div className="flex justify-between items-center w-full px-8 py-5 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="font-mono text-xl font-bold tracking-tighter flex items-center gap-1 group">
          <span className="text-[#00D97E] group-hover:animate-pulse">&gt;_</span>
          <span className="text-white">INVARIANT</span>
        </Link>

        {isApp ? (
          /* App nav */
          <div className="flex items-center gap-8">
            <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
            <NavLink href="/scan/new" active={pathname.startsWith('/scan/new')}>New Scan</NavLink>
            <NavLink href="/history" active={pathname === '/history'}>History</NavLink>
            <NavLink href="/settings" active={pathname.startsWith('/settings')}>Settings</NavLink>
            <div className="w-px h-4 bg-zinc-700 mx-2" />
            <span className="text-[10px] font-mono text-zinc-500 border border-zinc-700 px-2 py-1 uppercase tracking-widest">
              Community
            </span>
          </div>
        ) : (
          /* Marketing nav */
          <div className="hidden md:flex items-center gap-12">
            <MarketingLink href="/pricing">Pricing</MarketingLink>
            <MarketingLink href="/about">Why Invariant</MarketingLink>
            <MarketingLink href="/blog">Blog</MarketingLink>
            <MarketingLink href="/docs">Docs</MarketingLink>
          </div>
        )}

        {!isApp && (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-zinc-500 text-sm font-mono hover:text-white transition-colors uppercase tracking-widest"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-[#00D97E] text-white font-bold px-5 py-2 text-sm uppercase tracking-tighter hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,217,126,0.2)]"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'text-xs font-mono uppercase tracking-widest transition-colors',
        active ? 'text-[#00D97E]' : 'text-zinc-500 hover:text-zinc-200'
      )}
    >
      {children}
    </Link>
  )
}

function MarketingLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-zinc-500 font-medium hover:text-[#00D97E] transition-colors text-xs uppercase tracking-[0.15em] font-mono"
    >
      {children}
    </Link>
  )
}