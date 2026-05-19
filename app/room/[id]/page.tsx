import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getRoomById } from '@/lib/store'
import AudienceRoom from '@/components/AudienceRoom'

export default async function RoomPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const raw = cookieStore.get('session')?.value
  const session = raw ? JSON.parse(raw) : null

  if (!session || session.roomId !== params.id) redirect('/')

  const room = getRoomById(params.id)
  if (!room) redirect('/')

  const attendee = room.attendees.get(session.attendeeId)
  if (!attendee) redirect('/')

  return (
    <AudienceRoom
      roomId={params.id}
      roomTitle={room.title}
      displayName={attendee.name}
      profileTag={`${attendee.proficiencyLevel} · ${attendee.fieldOfStudy}`}
    />
  )
}
