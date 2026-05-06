'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/wordmark'
import { Icons } from '@/components/ui/icons'
import { Sev } from '@/components/ui/wordmark'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/scan/demo', label: 'Reports', icon: 'report' },
  { href: '/history', label: 'Scan history', icon: 'history' },
  { href: '/scan/new', label: 'New scan', icon: 'scan' },
]

const accountItems = [
  { href: '/pricing', label: 'Plan & billing', icon: 'pricing' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={26} />
          <div>
            <div className="brand-name">Invariant</div>
            <div className="muted" style={{ fontSize: 11 }}>Mosaic workspace</div>
          </div>
        </div>

        {navItems.map(item => {
          const Icon = Icons[item.icon as keyof typeof Icons]
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
              <span className="ico"><Icon /></span>
              <span>{item.label}</span>
            </Link>
          )
        })}

        <div className="nav-section-label">Account</div>

        {accountItems.map(item => {
          const Icon = Icons[item.icon as keyof typeof Icons]
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
              <span className="ico"><Icon /></span>
              <span>{item.label}</span>
            </Link>
          )
        })}

        <div className="nav-spacer" />

        <div className="card" style={{ padding: 14, marginBottom: 12, background: 'var(--bg-3)' }}>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <Sev level="critical" />
            <span style={{ fontSize: 12 }}>2 open</span>
          </div>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
            You have unresolved critical findings. Share the report to get them fixed.
          </p>
          <Link href="/scan/demo" className="btn btn-primary btn-sm" style={{ width: '100%', display: 'flex' }}>
            Open report
          </Link>
        </div>

        <div className="user-card">
          <div className="avatar">SC</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sarah Chen</div>
            <div className="muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>sarah@usemosaic.com</div>
          </div>
        </div>
      </aside>

      <main style={{ minWidth: 0, overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}
