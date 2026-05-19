export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById, setReaction, clearReaction } from '@/lib/store'
import { cookies } from 'next/headers'

const ALLOWED_EMOJIS = ['🔥', '👍', '😮', '🤔', '😴']

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const cookieStore = cookies()
  const raw = cookieStore.get('session')?.value
  const session = raw ? JSON.parse(raw) : null
  if (!session || session.roomId !== params.id) {
    return NextResponse.json({ error: 'Not joined in this room' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  // Client calls with { clear: true } after the 5s lock expires
  if (body.clear === true) {
    clearReaction(params.id, session.attendeeId)
    return NextResponse.json({ active: null })
  }

  const { emoji } = body
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
  }

  setReaction(params.id, session.attendeeId, emoji)
  return NextResponse.json({ active: emoji })
}
