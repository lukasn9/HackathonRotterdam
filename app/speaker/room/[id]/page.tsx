'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TranscriptControls from '@/components/TranscriptControls'
import AttendeeList from '@/components/AttendeeList'
import DemographicsChart from '@/components/DemographicsChart'
import ReactionStats from '@/components/ReactionStats'
import TopicBubbles from '@/components/TopicBubbles'

type RoomInfo = { id: string; accessCode: string; title: string; isPlaying: boolean; currentLineIndex: number; totalLines: number }
type Attendee = { id: string; name: string; institution: string; fieldOfStudy: string; proficiencyLevel: string; joinedAt: string }

export default function SpeakerRoomPage() {
  const params = useParams()
  const roomId = params.id as string

  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [qrUrl, setQrUrl] = useState<string>('')
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // Fetch room metadata
    fetch(`/api/room/${roomId}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => { if (data) setRoom(data) })
      .catch(() => setNotFound(true))

    // Fetch QR code
    fetch(`/api/room/${roomId}/qr`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.dataUrl) { setQrDataUrl(data.dataUrl); setQrUrl(data.url ?? '') } })
      .catch(() => {})

    // Fetch initial attendees
    fetch(`/api/room/${roomId}/attendees`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setAttendees(data.attendees) })
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

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl">Room not found</p>
          <a href="/speaker" className="text-blue-400 hover:underline">← Create new room</a>
        </div>
      </main>
    )
  }

  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </main>
    )
  }

  const formattedCode = `${room.accessCode.slice(0, 3)}-${room.accessCode.slice(3)}`
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${room.accessCode}` : ''

  return (
    <main className="min-h-screen bg-gray-900 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{room.title}</h1>
          <p className="text-gray-500 text-sm">Speaker Dashboard · {room.currentLineIndex + 1} / {room.totalLines} lines</p>
        </div>
        <a href="/speaker" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">← New room</a>
      </div>

      {/* Room code + QR + controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Room code */}
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Room Code</p>
          <p className="text-5xl font-mono font-bold tracking-widest text-white">{formattedCode}</p>
          {joinUrl && (
            <p className="text-xs text-gray-600 mt-3 break-all">{joinUrl}</p>
          )}
        </div>

        {/* QR code */}
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Room QR code" className="w-40 h-40 rounded-lg" />
              <p className="text-xs text-gray-500 mt-2">Scan to join</p>
              {qrUrl && <p className="text-[10px] text-gray-600 mt-1 break-all text-center">{qrUrl}</p>}
            </>
          ) : (
            <div className="w-40 h-40 bg-gray-700 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Playback controls */}
        <div className="bg-gray-800 rounded-2xl p-6 flex flex-col justify-center gap-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Transcript Playback</p>
          <TranscriptControls roomId={roomId} isPlayingInitial={room.isPlaying} />
          <p className="text-xs text-gray-600">Auto-play advances one line every 4 seconds</p>
        </div>
      </div>

      {/* Live reactions + Topic bubbles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-2xl p-6">
          <ReactionStats roomId={roomId} />
        </div>
        <div className="bg-gray-800 rounded-2xl p-6">
          <TopicBubbles roomId={roomId} />
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
