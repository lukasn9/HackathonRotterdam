export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById, addAttendee, type FieldOfStudy, type ProficiencyLevel } from '@/lib/store'
import { randomUUID } from 'crypto'

const VALID_FIELDS = ['STEM', 'Humanities', 'Business', 'Medicine']
const VALID_LEVELS = ['Novice', 'Intermediate', 'Expert']

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { name, institution, fieldOfStudy, proficiencyLevel } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!VALID_FIELDS.includes(fieldOfStudy)) {
    return NextResponse.json({ error: 'Invalid field of study' }, { status: 400 })
  }
  if (!VALID_LEVELS.includes(proficiencyLevel)) {
    return NextResponse.json({ error: 'Invalid proficiency level' }, { status: 400 })
  }

  const attendee = {
    id: randomUUID(),
    name: name.trim().slice(0, 50),
    institution: typeof institution === 'string' ? institution.trim().slice(0, 100) : '',
    fieldOfStudy: fieldOfStudy as FieldOfStudy,
    proficiencyLevel: proficiencyLevel as ProficiencyLevel,
    joinedAt: new Date(),
  }

  addAttendee(params.id, attendee)

  const response = NextResponse.json({ success: true, attendeeId: attendee.id })
  response.cookies.set('session', JSON.stringify({ attendeeId: attendee.id, roomId: params.id }), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
  })
  return response
}
