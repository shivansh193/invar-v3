export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type ScanType = 'unauthenticated' | 'authenticated'

export type ScanStatus = 'queued' | 'running' | 'complete' | 'failed'

export type ScanDepth = 'quick' | 'shallow' | 'standard' | 'deep'

export interface Finding {
  id: string
  scanId: string
  severity: Severity
  title: string
  category: string
  description: string
  businessRisk: string
  howFound: string
  howToFix: string
  effortEstimate: 'minutes' | 'hours' | 'days'
  references: { label: string; url: string }[]
  endpoint?: string
  isFixed: boolean
  createdAt: string
}

export interface Scan {
  id: string
  userId: string
  targetUrl: string
  type: ScanType
  depth: ScanDepth
  status: ScanStatus
  overallSeverity: Severity | 'clean'
  executiveSummary?: string
  findingCounts: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  findings: Finding[]
  startedAt: string
  completedAt?: string
  estimatedDuration?: number // seconds
}

export interface ScanProgressEvent {
  type: 'status' | 'finding' | 'complete' | 'error'
  message?: string
  finding?: Partial<Finding>
  progress?: number // 0-100
  scan?: Scan
}

export interface User {
  id: string
  email: string
  name?: string
  plan: 'free' | 'growth' | 'scale' | 'enterprise'
  createdAt: string
}

export interface DashboardStats {
  postureScore: number // 0-100
  totalScans: number
  openFindings: {
    critical: number
    high: number
    medium: number
    low: number
  }
  recentScans: Scan[]
  postureHistory: { date: string; score: number }[]
}