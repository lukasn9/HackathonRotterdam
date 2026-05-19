'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TranscriptControls from '@/components/TranscriptControls'
import AttendeeList from '@/components/AttendeeList'
import DemographicsChart from '@/components/DemographicsChart'

type RoomInfo = { id: string; accessCode: string; title: string }
type Attendee = { id: string; name: string; institution: string; fieldOfStudy: string; proficiencyLevel: string; joinedAt: string }

export default function SpeakerRoomPage() {
  const params = useParams()
  const roomId = params.id as string

  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // Fetch room info via attendees route (reuse) or direct
    fetch(`/api/room/${roomId}/attendees`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => { if (data) setAttendees(data.attendees) })
      .catch(() => setNotFound(true))

    // Fetch QR code
    fetch(`/api/room/${roomId}/qr`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.dataUrl) setQrDataUrl(data.dataUrl) })
      .catch(() => {})

    // Poll attendees every 5s
    const interval = setInterval(() => {
      fetch(`/api/room/${roomId}/attendees`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setAttendees(data.attendees) })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [roomId])

  // Get room info from first attendees call — we need it separately
  useEffect(() => {
    fetch(`/api/rooms`)
      .then(() => {}) // not useful here; get room info from a GET by id
      .catch(() => {})
    // Hack: since we don't have GET /api/room/[id], derive from QR or use roomId
    // We'll fetch room via a tiny workaround using the rooms lookup in attendees
  }, [roomId])

  // Simpler: get room title from window history state or store a separate fetch
  const [roomTitle, setRoomTitle] = useState('')
  const [roomCode, setRoomCode] = useState('')

  useEffect(() => {
    // Fetch room title by checking a GET endpoint we can add, or store in sessionStorage
    const stored = sessionStorage.getItem(`room-${roomId}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      setRoomTitle(parsed.title)
      setRoomCode(parsed.accessCode)
    }
  }, [roomId])

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl">Room not found</p>
          <a href="/speaker" className="text-indigo-400 hover:underline">← Create new room</a>
        </div>
      </main>
    )
  }

  const formattedCode = roomCode
    ? `${roomCode.slice(0, 3)}-${roomCode.slice(3)}`
    : '···-···'

  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${roomCode}`

  return (
    <main className="min-h-screen bg-gray-900 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{roomTitle || 'Presentation'}</h1>
          <p className="text-gray-500 text-sm">Speaker Dashboard</p>
        </div>
        <a href="/speaker" className="text-sm text-gray-500 hover:text-gray-300">← New room</a>
      </div>

      {/* Room code + QR + controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Room code */}
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Room Code</p>
          <p className="text-5xl font-mono font-bold tracking-widest text-white">{formattedCode}</p>
          <p className="text-xs text-gray-500 mt-3">Share this with your audience</p>
        </div>

        {/* QR code */}
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR code" className="w-36 h-36 rounded-lg" />
              <p className="text-xs text-gray-500 mt-2 text-center">Scan to join</p>
            </>
          ) : (
            <div className="w-36 h-36 bg-gray-700 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Playback controls */}
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col justify-center gap-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Transcript Playback</p>
          <TranscriptControls roomId={roomId} />
          <p className="text-xs text-gray-600">Lines advance every 4 seconds on auto-play</p>
        </div>
      </div>

      {/* Attendees + Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-2xl p-6">
          <AttendeeList roomId={roomId} />
        </div>
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Audience Demographics
          </h3>
          <DemographicsChart attendees={attendees} />
        </div>
      </div>
    </main>
  )
}
