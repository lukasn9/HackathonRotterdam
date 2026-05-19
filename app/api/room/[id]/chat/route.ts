export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/store'
import { answerQuestion } from '@/lib/gemini'
import { cookies } from 'next/headers'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const cookieStore = cookies()
  const raw = cookieStore.get('session')?.value
  const session = raw ? JSON.parse(raw) : null

  if (!session || session.roomId !== params.id) {
    return NextResponse.json({ error: 'Not joined in this room' }, { status: 403 })
  }

  const attendee = room.attendees.get(session.attendeeId)
  if (!attendee) return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  if (!question) return NextResponse.json({ error: 'Question is required' }, { status: 400 })

  const answer = await answerQuestion({
    question,
    transcript: room.transcript,
    currentIndex: room.currentLineIndex,
    attendee,
  })

  return NextResponse.json({ answer })
}
