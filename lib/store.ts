import { ScanType, ScanDepth } from './types'

export interface Finding {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  evidence: string
  remediation: string
  createdAt: string
}

export interface Scan {
  id: string
  targetUrl: string
  type: ScanType
  depth: ScanDepth
  status: 'queued' | 'scanning' | 'complete' | 'failed'
  findings: Finding[]
  createdAt: string
}

// In-memory store for the current runtime session
class MemoryStore {
  private scans: Map<string, Scan> = new Map()

  constructor() {
    console.log('In-memory store initialized')
  }

  createScan(data: Omit<Scan, 'id' | 'status' | 'findings' | 'createdAt'>): Scan {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase()
    const scan: Scan = {
      ...data,
      id,
      status: 'queued',
      findings: [],
      createdAt: new Date().toISOString()
    }
    this.scans.set(id, scan)
    return scan
  }

  getScan(id: string): Scan | undefined {
    return this.scans.get(id)
  }

  getAllScans(): Scan[] {
    return Array.from(this.scans.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  updateScanStatus(id: string, status: Scan['status']) {
    const scan = this.scans.get(id)
    if (scan) {
      scan.status = status
      this.scans.set(id, scan)
    }
  }

  addFinding(id: string, finding: Omit<Finding, 'id' | 'createdAt'>) {
    const scan = this.scans.get(id)
    if (scan) {
      const newFinding: Finding = {
        ...finding,
        id: `F-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString()
      }
      scan.findings.push(newFinding)
      this.scans.set(id, scan)
      return newFinding
    }
    return null
  }
}

// Singleton instance
const globalForStore = globalThis as unknown as { store: MemoryStore }
export const store = globalForStore.store ?? new MemoryStore()

if (process.env.NODE_ENV !== 'production') globalForStore.store = store
