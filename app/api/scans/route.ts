import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { ScanType, ScanDepth } from '@/lib/types'

// POST /api/scans — create a new scan job in memory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { targetUrl, type, depth } = body as {
      targetUrl: string
      type: ScanType
      depth: ScanDepth
    }

    // Validate
    if (!targetUrl) {
      return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 })
    }

    try {
      new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Create scan record in the in-memory store
    const scan = store.createScan({
      targetUrl: targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`,
      type,
      depth: depth ?? 'standard',
    })

    return NextResponse.json(
      { id: scan.id, status: 'queued', message: 'Scan queued successfully' },
      { status: 201 }
    )
  } catch (err) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET /api/scans — list scans for current user from memory
export async function GET() {
  const scans = store.getAllScans()

  // If no scans in store, return empty (or mock data if desired)
  return NextResponse.json({ scans })
}