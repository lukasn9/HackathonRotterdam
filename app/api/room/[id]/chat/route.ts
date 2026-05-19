export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getRoomById, getAttendeeById } from '@/lib/store'
import { answerQuestion } from '@/lib/gemini'
import { SAMPLE_TRANSCRIPT } from '@/lib/transcript-data'
import { cookies } from 'next/headers'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const cookieStore = cookies()
  const raw = cookieStore.get('session')?.value
  const session = raw ? JSON.parse(raw) : null
  if (!session || session.roomId !== params.id) {
    return NextResponse.json({ error: 'Not joined in this room' }, { status: 403 })
  }

  const attendee = await getAttendeeById(params.id, session.attendeeId)
  if (!attendee) return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  if (!question) return NextResponse.json({ error: 'Question is required' }, { status: 400 })

  const answer = await answerQuestion({
    question,
    transcript: SAMPLE_TRANSCRIPT,
    currentIndex: room.currentLineIndex,
    attendee,
  })

  return NextResponse.json({ answer })
}
