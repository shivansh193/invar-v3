import { Severity } from '@/lib/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<Severity, { label: string; classes: string }> = {
  critical: { label: 'CRITICAL', classes: 'bg-red-500/10 text-red-400 border-red-500/30' },
  high:     { label: 'HIGH',     classes: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  medium:   { label: 'MEDIUM',   classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  low:      { label: 'LOW',      classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  info:     { label: 'INFO',     classes: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
}

interface SeverityBadgeProps {
  severity: Severity
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SeverityBadge({ severity, className, size = 'md' }: SeverityBadgeProps) {
  const s = severity.toLowerCase() as Severity
  const config = CONFIG[s] || CONFIG.info
  const { label, classes } = config
  return (
    <span
      className={cn(
        'font-mono font-bold border tracking-widest uppercase inline-block',
        size === 'sm' && 'text-[9px] px-1.5 py-0.5',
        size === 'md' && 'text-[10px] px-2 py-1',
        size === 'lg' && 'text-xs px-3 py-1.5',
        classes,
        className
      )}
    >
      {label}
    </span>
  )
}

export function severityColor(severity: Severity | 'clean'): string {
  const map: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-blue-400',
    info: 'text-zinc-400',
    clean: 'text-[#00D97E]',
  }
  return map[severity] ?? 'text-zinc-400'
}

export function severityDot(severity: Severity | 'clean'): string {
  const map: Record<string, string> = {
    critical: 'bg-red-400',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-blue-400',
    info: 'bg-zinc-400',
    clean: 'bg-[#00D97E]',
  }
  return map[severity] ?? 'bg-zinc-400'
}