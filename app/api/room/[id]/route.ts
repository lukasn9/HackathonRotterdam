export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  return NextResponse.json({
    id: room.id,
    accessCode: room.accessCode,
    title: room.title,
    isPlaying: room.isPlaying,
    currentLineIndex: room.currentLineIndex,
    totalLines: room.transcript.length,
  })
}
