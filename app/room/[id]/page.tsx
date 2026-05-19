import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getRoomById, getAttendeeById } from '@/lib/store'
import AudienceRoom from '@/components/AudienceRoom'

export default async function RoomPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const raw = cookieStore.get('session')?.value
  const session = raw ? JSON.parse(raw) : null

  if (!session || session.roomId !== params.id) redirect('/')

  const [room, attendee] = await Promise.all([
    getRoomById(params.id),
    getAttendeeById(params.id, session.attendeeId),
  ])

  if (!room || !attendee) redirect('/')

  return (
    <AudienceRoom
      roomId={params.id}
      roomTitle={room.title}
      displayName={attendee.name}
      profileTag={`${attendee.proficiencyLevel} · ${attendee.fieldOfStudy}`}
    />
  )
}
