import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const body = await req.json()
  const { url } = body as { url: string }

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const domain = extractApexDomain(url)

  const alreadyVerified = await prisma.verifiedDomain.findFirst({
    where: { userId, domain, verified: true },
  })
  if (alreadyVerified) {
    return NextResponse.json({ alreadyVerified: true, domain })
  }

  let record = await prisma.verifiedDomain.findFirst({
    where: { userId, domain },
  })
  if (!record) {
    record = await prisma.verifiedDomain.create({
      data: { userId, domain },
    })
  }

  return NextResponse.json({
    alreadyVerified: false,
    domain,
    domainId: record.id,
    token: record.token,
    methods: [
      {
        type: 'dns',
        instructions: `Add a TXT record: _invariant-verify.${domain} → invariant-verify=${record.token}`,
      },
      {
        type: 'file',
        instructions: `Host the token at https://${domain}/.well-known/invariant-verify.txt`,
      },
    ],
  })
}

function extractApexDomain(url: string): string {
  try {
    const { hostname } = new URL(url.startsWith('http') ? url : `https://${url}`)
    const parts = hostname.split('.')
    if (parts.length <= 2) return hostname
    return parts.slice(-2).join('.')
  } catch {
    return url
  }
}
