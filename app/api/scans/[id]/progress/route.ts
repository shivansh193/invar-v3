import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { store } from '@/lib/store'
import { assertScanOwnership, ScanNotFoundError } from '@/lib/scan-auth'
import { runScan, ScanOptions } from '@/lib/scanner'

export const maxDuration = 120 // Vercel: allow up to 2 minutes for a scan

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Scan not found', { status: 404 })
  }

  const { id } = await params
  const userId = (session.user as any).id as string

  try {
    await assertScanOwnership(id, userId)
  } catch (err) {
    if (err instanceof ScanNotFoundError) {
      return new Response('Scan not found', { status: 404 })
    }
    return new Response('Internal Server Error', { status: 500 })
  }

  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false

      const sendEvent = (data: any, name?: string) => {
        if (closed) return
        const payload = name
          ? `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
          : `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      // If scan already completed, replay existing findings and close
      const existingScan = await store.getScan(id)
      if (existingScan?.status === 'complete') {
        for (const f of existingScan.findings) {
          sendEvent({ progress: 100, message: `[FOUND] ${f.title}`, finding: f })
        }
        sendEvent({ progress: 100, message: 'Scan complete. Report ready.' }, 'complete')
        controller.close()
        return
      }

      await store.updateScanStatus(id, 'running')
      const scan = await store.getScan(id)
      const targetUrl = scan?.targetUrl ?? ''

      // Read and immediately clear credentials from DB so they aren't stored longer than needed
      const credentials = await store.getScanCredentials(id)
      await store.clearScanCredentials(id)

      const scanOptions: ScanOptions = {
        mode: scan?.type as ScanOptions['mode'],
        depth: scan?.depth as ScanOptions['depth'],
        credentials: credentials ?? undefined,
      }

      try {
        const { findings, summary } = await runScan(targetUrl, (event, eventName) => {
          if (event.finding) {
            // Persist finding to DB then stream it
            store.addFinding(id, {
              title: event.finding.title,
              severity: event.finding.severity,
              category: event.finding.category,
              description: event.finding.description,
              evidence: event.finding.evidence,
              remediation: event.finding.remediation,
            }).then((saved) => {
              sendEvent({
                progress: event.progress,
                message: event.message,
                finding: saved ?? event.finding,
              })
            })
          } else {
            sendEvent({ progress: event.progress, message: event.message }, eventName)
          }
        }, scanOptions)

        // Small delay so the last DB writes finish before we mark complete
        await new Promise<void>((r) => setTimeout(r, 800))

        await store.updateScanStatus(id, 'complete')
        if (summary) await store.updateScanSummary(id, summary)

        const total = findings.length
        const crits = findings.filter((f) => f.severity === 'CRITICAL').length
        const highs = findings.filter((f) => f.severity === 'HIGH').length
        const severityLabel = [
          crits > 0 && `${crits} critical`,
          highs > 0 && `${highs} high`,
        ]
          .filter(Boolean)
          .join(' · ')

        sendEvent(
          {
            progress: 100,
            message: `Scan complete. ${total} finding${total !== 1 ? 's' : ''}${severityLabel ? ' — ' + severityLabel : ''}.`,
          },
          'complete',
        )
      } catch (err) {
        console.error('Scanner error:', err)
        await store.updateScanStatus(id, 'failed')
        sendEvent(
          { progress: 100, message: `Scan failed: ${(err as Error).message}` },
          'complete',
        )
      }

      closed = true
      controller.close()
    },
  })

  return new Response(stream, { headers: responseHeaders })
}
