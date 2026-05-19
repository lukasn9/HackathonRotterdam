'use client'

import { useEffect, useRef, useState } from 'react'

type Line = { text: string; index: number }

export default function TranscriptView({ roomId }: { roomId: string }) {
  const [lines, setLines] = useState<Line[]>([])
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const es = new EventSource(`/api/room/${roomId}/stream`)

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.reset) {
          setLines([])
          return
        }
        if (typeof data.line === 'string') {
          setLines((prev) => {
            // Avoid duplicates on reconnect
            if (prev.some((l) => l.index === data.index)) return prev
            return [...prev, { text: data.line, index: data.index }]
          })
        }
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [roomId])

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

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
                key={line.index}
                className={`leading-relaxed transition-all duration-500 ${
                  isActive
                    ? 'text-white text-xl font-medium'
                    : 'text-gray-500 text-lg opacity-60'
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
