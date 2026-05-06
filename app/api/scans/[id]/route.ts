import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { assertScanOwnership, ScanNotFoundError } from '@/lib/scan-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  const { id } = await params
  const userId = (session.user as any).id as string

  try {
    const dbScan = await assertScanOwnership(id, userId)
    const scan = {
      id: dbScan.id,
      userId: dbScan.userId,
      targetUrl: dbScan.url,
      type: dbScan.mode,
      depth: dbScan.depth,
      status: dbScan.status,
      findings: dbScan.findings.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        description: f.description,
        evidence: f.evidence,
        remediation: f.remediation,
        createdAt: f.createdAt.toISOString(),
      })),
      createdAt: dbScan.createdAt.toISOString(),
    }
    return NextResponse.json({ scan })
  } catch (err) {
    if (err instanceof ScanNotFoundError) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
