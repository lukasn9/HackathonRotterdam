export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const attendees = Array.from(room.attendees.values()).map((a) => ({
    id: a.id,
    name: a.name,
    institution: a.institution,
    fieldOfStudy: a.fieldOfStudy,
    proficiencyLevel: a.proficiencyLevel,
    joinedAt: a.joinedAt,
  }))

  return NextResponse.json({ attendees })
}
