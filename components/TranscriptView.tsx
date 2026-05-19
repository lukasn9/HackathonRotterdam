'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { SAMPLE_TRANSCRIPT } from '@/lib/transcript-data'

export default function TranscriptView({ roomId }: { roomId: string }) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch current state immediately so late joiners see existing lines
    fetch(`/api/room/${roomId}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.currentLineIndex === 'number') setCurrentIndex(d.currentLineIndex) })
      .catch(() => {})

    const supabase = createBrowserClient()

    const channel = supabase
      .channel(`room-transcript-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const newIndex = (payload.new as { current_line_index: number }).current_line_index
          if (typeof newIndex === 'number') setCurrentIndex(newIndex)
        },
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentIndex])

  const lines = currentIndex >= 0 ? SAMPLE_TRANSCRIPT.slice(0, currentIndex + 1) : []

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-600'}`} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">Live Transcript</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {lines.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-600 text-sm">
            Waiting for the presentation to begin...
          </div>
        ) : (
          lines.map((line, i) => {
            const isActive = i === lines.length - 1
            return (
              <p
                key={i}
                className={`leading-relaxed transition-all duration-500 ${
                  isActive
                    ? 'text-white text-lg font-medium'
                    : 'text-gray-500 text-base opacity-60'
                }`}
              >
                {line.text}
              </p>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
