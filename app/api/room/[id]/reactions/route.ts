export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getRoomById, getReactionStats, getReactionTimeline } from '@/lib/store'
import { SAMPLE_TRANSCRIPT } from '@/lib/transcript-data'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const [stats, timeline] = await Promise.all([
    getReactionStats(params.id),
    getReactionTimeline(params.id),
  ])

  const isFinished = room.currentLineIndex >= SAMPLE_TRANSCRIPT.length - 1 && room.currentLineIndex >= 0

  return NextResponse.json({
    counts: stats.counts,
    total: stats.total,
    respondents: stats.respondents,
    timeline: timeline.map((e) => ({
      id: e.id,
      emoji: e.emoji,
      attendeeName: e.attendeeName,
      lineIndex: e.lineIndex,
      timestamp: e.timestamp,
    })),
    isFinished,
  })
}
