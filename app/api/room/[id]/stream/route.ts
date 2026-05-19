export const runtime = 'nodejs'

import { getRoomById, broadcastToRoom, type SSEClient } from '@/lib/store'
import { randomUUID } from 'crypto'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) {
    return new Response('Room not found', { status: 404 })
  }

  const clientId = randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      const client: SSEClient = { id: clientId, controller }
      room.sseClients.add(client)

      // Send catchup: all lines revealed so far
      if (room.currentLineIndex >= 0) {
        const catchup = room.transcript.slice(0, room.currentLineIndex + 1)
        for (let i = 0; i < catchup.length; i++) {
          const payload = `data: ${JSON.stringify({ line: catchup[i].text, index: i })}\n\n`
          try {
            controller.enqueue(new TextEncoder().encode(payload))
          } catch {
            break
          }
        }
      }

      // Send a heartbeat comment to establish connection
      try {
        controller.enqueue(new TextEncoder().encode(': connected\n\n'))
      } catch {
        room.sseClients.delete(client)
      }

      // Cleanup on disconnect
      const cleanup = () => {
        room.sseClients.delete(client)
        try { controller.close() } catch { /* already closed */ }
      }

      // Store cleanup ref on client for later cancellation
      ;(client as SSEClient & { cleanup?: () => void }).cleanup = cleanup
    },
    cancel() {
      for (const c of Array.from(room.sseClients)) {
        if (c.id === clientId) {
          room.sseClients.delete(c)
          break
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
