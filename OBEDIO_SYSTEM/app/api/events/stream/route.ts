import { NextRequest } from 'next/server'
import { emitter, SSE_EVENTS } from '@/lib/sseEmitter'
import { getSessionCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Check authentication
  const session = getSessionCookie()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  }

  // Create a transform stream
  const encoder = new TextEncoder()
  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial message to confirm connection
      controller.enqueue(encoder.encode('event: connected\ndata: {"connected": true}\n\n'))

      // Handler for new service requests
      const newRequestHandler = (data: any) => {
        controller.enqueue(encoder.encode(`event: ${SSE_EVENTS.NEW_REQUEST}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Handler for device updates
      const deviceUpdateHandler = (data: any) => {
        controller.enqueue(encoder.encode(`event: ${SSE_EVENTS.DEVICE_UPDATE}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Handler for system status updates
      const systemStatusHandler = (data: any) => {
        controller.enqueue(encoder.encode(`event: ${SSE_EVENTS.SYSTEM_STATUS}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Handler for new device added
      const deviceAddedHandler = (data: any) => {
        controller.enqueue(encoder.encode(`event: ${SSE_EVENTS.DEVICE_ADDED}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Register event listeners
      emitter.on(SSE_EVENTS.NEW_REQUEST, newRequestHandler)
      emitter.on(SSE_EVENTS.DEVICE_UPDATE, deviceUpdateHandler)
      emitter.on(SSE_EVENTS.SYSTEM_STATUS, systemStatusHandler)
      emitter.on(SSE_EVENTS.DEVICE_ADDED, deviceAddedHandler)

      // Keep-alive interval
      const keepAliveInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'))
      }, 30000) // 30 seconds

      // Cleanup function for when the connection is closed
      request.signal.addEventListener('abort', () => {
        emitter.off(SSE_EVENTS.NEW_REQUEST, newRequestHandler)
        emitter.off(SSE_EVENTS.DEVICE_UPDATE, deviceUpdateHandler)
        emitter.off(SSE_EVENTS.SYSTEM_STATUS, systemStatusHandler)
        emitter.off(SSE_EVENTS.DEVICE_ADDED, deviceAddedHandler)
        clearInterval(keepAliveInterval)
        controller.close()
      })
    }
  })

  return new Response(customReadable, { headers })
}
