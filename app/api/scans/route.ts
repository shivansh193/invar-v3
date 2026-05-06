import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { store } from '@/lib/store'
import { prisma } from '@/lib/prisma'
import { ScanType, ScanDepth } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id as string
    const userPlan = (session.user as any).plan as string ?? 'free'

    const body = await req.json()
    const { targetUrl, type, depth } = body as {
      targetUrl: string
      type: ScanType
      depth: ScanDepth
    }

    if (!targetUrl) {
      return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 })
    }

    let normalizedUrl: string
    try {
      const u = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`)
      normalizedUrl = u.toString()
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Plan enforcement: authenticated scans require growth+
    if (type === 'authenticated' && userPlan === 'free') {
      return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })
    }

    // Plan enforcement: free tier — max 1 scan per day
    if (userPlan === 'free') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentCount = await prisma.scan.count({
        where: { userId, createdAt: { gte: dayAgo } },
      })
      if (recentCount >= 1) {
        return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
      }
    }

    // Domain verification: check that the target domain is verified for this user
    const targetDomain = extractApexDomain(normalizedUrl)
    const verified = await prisma.verifiedDomain.findFirst({
      where: { userId, domain: targetDomain, verified: true },
    })
    if (!verified) {
      // Initiate verification if not already pending
      let pending = await prisma.verifiedDomain.findFirst({
        where: { userId, domain: targetDomain },
      })
      if (!pending) {
        pending = await prisma.verifiedDomain.create({
          data: { userId, domain: targetDomain },
        })
      }
      return NextResponse.json(
        {
          error: 'domain_not_verified',
          domain: targetDomain,
          domainId: pending.id,
          token: pending.token,
        },
        { status: 403 }
      )
    }

    const scan = await store.createScan({
      targetUrl: normalizedUrl,
      type: type ?? 'unauthenticated',
      depth: depth ?? 'standard',
      userId,
    })

    return NextResponse.json(
      { id: scan.id, status: 'pending', message: 'Scan queued successfully' },
      { status: 201 }
    )
  } catch (err) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const scans = await store.getScansByUser(userId)
  return NextResponse.json({ scans })
}

function extractApexDomain(url: string): string {
  try {
    const { hostname } = new URL(url)
    const parts = hostname.split('.')
    if (parts.length <= 2) return hostname
    return parts.slice(-2).join('.')
  } catch {
    return url
  }
}
