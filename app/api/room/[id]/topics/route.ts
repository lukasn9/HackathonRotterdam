export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const topics = Object.entries(room.questionTopics)
    .map(([label, questions]) => ({ label, count: questions.length, questions }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ topics })
}
