export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById, getReactionCounts } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const counts = getReactionCounts(params.id)
  const total = Object.values(counts).reduce((s, v) => s + v, 0)
  const isFinished = room.currentLineIndex >= room.transcript.length - 1 && room.currentLineIndex >= 0

  // Return all stored events (up to 50), newest first
  const timeline = [...room.reactionTimeline]
    .reverse()
    .map((e) => ({
      id: e.id,
      emoji: e.emoji,
      attendeeName: e.attendeeName,
      lineIndex: e.lineIndex,
      timestamp: e.timestamp,
    }))

  return NextResponse.json({ counts, total, respondents: room.reactions.size, timeline, isFinished })
}
