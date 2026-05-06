export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="var(--accent)" />
      <path d="M9 11l7 7 7-7" stroke="var(--bg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 17l7 7 7-7" stroke="var(--bg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>
  )
}

export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Logo size={24} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size, letterSpacing: '-0.01em' }}>
        Invariant
      </span>
    </div>
  )
}

export function Sev({ level }: { level: string }) {
  return <span className={`sev sev-${level}`}>{level.toUpperCase()}</span>
}

export function PulseDot() {
  return <span className="pulse-dot" />
}
