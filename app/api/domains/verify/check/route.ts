import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import dns from 'dns/promises'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const body = await req.json()
  const { domainId } = body as { domainId: string }

  if (!domainId) {
    return NextResponse.json({ error: 'domainId is required' }, { status: 400 })
  }

  const record = await prisma.verifiedDomain.findFirst({
    where: { id: domainId, userId },
  })
  if (!record) {
    return NextResponse.json({ error: 'Domain record not found' }, { status: 404 })
  }

  const tried: string[] = []
  let verified = false

  // DNS TXT verification
  try {
    tried.push('dns')
    const records = await dns.resolveTxt(`_invariant-verify.${record.domain}`)
    const flat = records.flat()
    if (flat.some((r) => r === `invariant-verify=${record.token}`)) {
      verified = true
    }
  } catch {
    // DNS lookup failure — not verified via DNS
  }

  // File verification (only if DNS didn't succeed)
  if (!verified) {
    try {
      tried.push('file')
      const res = await fetch(
        `https://${record.domain}/.well-known/invariant-verify.txt`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (res.ok) {
        const text = await res.text()
        if (text.trim().includes(record.token)) {
          verified = true
        }
      }
    } catch {
      // File fetch failure — not verified via file
    }
  }

  if (verified) {
    await prisma.verifiedDomain.update({
      where: { id: record.id },
      data: { verified: true },
    })
    return NextResponse.json({ verified: true, domain: record.domain })
  }

  return NextResponse.json({
    verified: false,
    domain: record.domain,
    tried,
  })
}
