'use client'

import { useEffect, useState } from 'react'

type Attendee = {
  id: string
  name: string
  institution: string
  fieldOfStudy: string
  proficiencyLevel: string
  joinedAt: string
}

export default function AttendeeList({ roomId }: { roomId: string }) {
  const [attendees, setAttendees] = useState<Attendee[]>([])

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`/api/room/${roomId}/attendees`)
        if (res.ok) {
          const data = await res.json()
          setAttendees(data.attendees)
        }
      } catch { /* ignore */ }
    }
    fetch_()
    const interval = setInterval(fetch_, 5000)
    return () => clearInterval(interval)
  }, [roomId])

  const levelColor: Record<string, string> = {
    Novice: 'text-green-400',
    Intermediate: 'text-yellow-400',
    Expert: 'text-red-400',
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Attendees ({attendees.length})
      </h3>
      {attendees.length === 0 ? (
        <p className="text-gray-600 text-sm">No attendees yet. Share the room code!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-2 font-normal">Name</th>
                <th className="text-left pb-2 font-normal">Institution</th>
                <th className="text-left pb-2 font-normal">Field</th>
                <th className="text-left pb-2 font-normal">Level</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((a) => (
                <tr key={a.id} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4 text-white">{a.name}</td>
                  <td className="py-2 pr-4 text-gray-400">{a.institution || '—'}</td>
                  <td className="py-2 pr-4 text-gray-300">{a.fieldOfStudy}</td>
                  <td className={`py-2 font-medium ${levelColor[a.proficiencyLevel] || ''}`}>
                    {a.proficiencyLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
