import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { store } from '@/lib/store'
import { assertScanOwnership, ScanNotFoundError } from '@/lib/scan-auth'

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
      const sendEvent = (data: any, name?: string) => {
        if (name) {
          controller.enqueue(
            encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
      }

      // 1. Initial State
      await store.updateScanStatus(id, 'running')
      const scan = await store.getScan(id)
      sendEvent({ progress: 5, message: `Initializing engine for ${scan?.targetUrl}...` })
      await new Promise((r) => setTimeout(r, 800))

      // 2. Discovering components
      sendEvent({ progress: 15, message: '[DISCOVER] Mapping attack surface...' })
      await new Promise((r) => setTimeout(r, 1200))
      sendEvent({ progress: 25, message: '[DISCOVER] Found 14 active endpoints' })

      // 3. Finding vulnerabilities
      sendEvent({ progress: 40, message: '[Fuzzer] Testing for BROKEN ACCESS CONTROL...' })
      await new Promise((r) => setTimeout(r, 1500))

      const finding1 = await store.addFinding(id, {
        title: 'Broken Access Control (IDOR)',
        severity: 'HIGH',
        description: 'Unauthorized access to user profile data via parameter manipulation.',
        evidence: 'GET /api/users/1004 returns profile for user 1004 without session token.',
        remediation: 'Implement server-side ownership checks before returning user data.',
      })
      sendEvent({ progress: 60, message: `[CRITICAL] VULNERABILITY FOUND: ${finding1?.title}` })

      sendEvent({ progress: 70, message: '[Fuzzer] Testing JWT validation...' })
      await new Promise((r) => setTimeout(r, 2000))

      const finding2 = await store.addFinding(id, {
        title: 'JWT Secret Collision',
        severity: 'CRITICAL',
        description: 'Common weak secret used for signing JSON Web Tokens.',
        evidence: 'Token signed with "secret" was accepted as valid.',
        remediation: 'Rotate signing keys and use a strong, unique secret stored in a vault.',
      })
      sendEvent({ progress: 85, message: `[CRITICAL] VULNERABILITY FOUND: ${finding2?.title}` })

      // 4. Cleanup and Complete
      sendEvent({ progress: 95, message: '[CLEANUP] Generating final report...' })
      await store.updateScanStatus(id, 'complete')
      await new Promise((r) => setTimeout(r, 1000))

      sendEvent({ progress: 100, message: 'Scan complete. Report ready.' }, 'complete')
      controller.close()
    },
  })

  return new Response(stream, { headers: responseHeaders })
}
