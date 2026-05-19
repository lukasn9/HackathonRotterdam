export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById, listAttendees } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const attendees = await listAttendees(params.id)
  return NextResponse.json({
    attendees: attendees.map((a) => ({
      id: a.id,
      name: a.name,
      institution: a.institution,
      fieldOfStudy: a.fieldOfStudy,
      proficiencyLevel: a.proficiencyLevel,
      joinedAt: a.joinedAt,
    })),
  })
}
