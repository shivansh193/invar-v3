import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const scan = store.getScan(id)

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  return NextResponse.json({ scan })
}