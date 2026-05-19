export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById, broadcastToRoom } from '@/lib/store'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const action = body.action as string

  if (action === 'start') {
    if (room.isPlaying) return NextResponse.json({ status: 'already playing' })
    if (room.currentLineIndex >= room.transcript.length - 1) {
      return NextResponse.json({ status: 'transcript finished' })
    }
    if (room.playbackInterval) clearInterval(room.playbackInterval)
    room.playbackInterval = setInterval(() => {
      if (room.currentLineIndex < room.transcript.length - 1) {
        room.currentLineIndex++
        broadcastToRoom(room.id, {
          line: room.transcript[room.currentLineIndex].text,
          index: room.currentLineIndex,
        })
      } else {
        clearInterval(room.playbackInterval)
        room.playbackInterval = undefined
        room.isPlaying = false
      }
    }, 4000)
    room.isPlaying = true
    return NextResponse.json({ status: 'started' })
  }

  if (action === 'pause') {
    if (room.playbackInterval) clearInterval(room.playbackInterval)
    room.playbackInterval = undefined
    room.isPlaying = false
    return NextResponse.json({ status: 'paused' })
  }

  if (action === 'advance') {
    if (room.currentLineIndex < room.transcript.length - 1) {
      room.currentLineIndex++
      broadcastToRoom(room.id, {
        line: room.transcript[room.currentLineIndex].text,
        index: room.currentLineIndex,
      })
    }
    return NextResponse.json({ status: 'advanced', index: room.currentLineIndex })
  }

  if (action === 'reset') {
    if (room.playbackInterval) clearInterval(room.playbackInterval)
    room.playbackInterval = undefined
    room.isPlaying = false
    room.currentLineIndex = -1
    broadcastToRoom(room.id, { reset: true, index: -1 })
    return NextResponse.json({ status: 'reset' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
