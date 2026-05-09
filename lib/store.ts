import { prisma } from './prisma'
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
  userId: string
  targetUrl: string
  type: ScanType
  depth: ScanDepth
  status: 'pending' | 'running' | 'complete' | 'failed'
  findings: Finding[]
  createdAt: string
}

function dbScanToScan(dbScan: any): Scan {
  return {
    id: dbScan.id,
    userId: dbScan.userId,
    targetUrl: dbScan.url,
    type: dbScan.mode as ScanType,
    depth: dbScan.depth as ScanDepth,
    status: dbScan.status as Scan['status'],
    findings: (dbScan.findings ?? []).map(dbFindingToFinding),
    createdAt: dbScan.createdAt instanceof Date
      ? dbScan.createdAt.toISOString()
      : dbScan.createdAt,
  }
}

function dbFindingToFinding(f: any): Finding {
  return {
    id: f.id,
    title: f.title,
    severity: f.severity as Finding['severity'],
    description: f.description,
    evidence: f.evidence,
    remediation: f.remediation,
    createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
  }
}

export const store = {
  async createScan(data: {
    targetUrl: string
    type: ScanType
    depth: ScanDepth
    userId: string
  }): Promise<Scan> {
    const dbScan = await prisma.scan.create({
      data: {
        url: data.targetUrl,
        mode: data.type,
        depth: data.depth,
        userId: data.userId,
        status: 'pending',
      },
      include: { findings: true },
    })
    return dbScanToScan(dbScan)
  },

  async getScan(id: string): Promise<Scan | null> {
    const dbScan = await prisma.scan.findUnique({
      where: { id },
      include: { findings: true },
    })
    return dbScan ? dbScanToScan(dbScan) : null
  },

  async getAllScans(): Promise<Scan[]> {
    const dbScans = await prisma.scan.findMany({
      include: { findings: true },
      orderBy: { createdAt: 'desc' },
    })
    return dbScans.map(dbScanToScan)
  },

  async getScansByUser(userId: string): Promise<Scan[]> {
    const dbScans = await prisma.scan.findMany({
      where: { userId },
      include: { findings: true },
      orderBy: { createdAt: 'desc' },
    })
    return dbScans.map(dbScanToScan)
  },

  async updateScanStatus(id: string, status: Scan['status']): Promise<void> {
    const data: any = { status }
    if (status === 'complete' || status === 'failed') {
      data.completedAt = new Date()
    }
    await prisma.scan.update({ where: { id }, data })
  },

  async addFinding(
    id: string,
    finding: Omit<Finding, 'id' | 'createdAt'> & { category?: string }
  ): Promise<Finding | null> {
    const scan = await prisma.scan.findUnique({ where: { id } })
    if (!scan) return null
    const dbFinding = await prisma.finding.create({
      data: {
        scanId: id,
        title: finding.title,
        severity: finding.severity,
        category: (finding as any).category ?? 'Security',
        description: finding.description,
        evidence: finding.evidence,
        remediation: finding.remediation,
      },
    })
    return dbFindingToFinding(dbFinding)
  },
}
