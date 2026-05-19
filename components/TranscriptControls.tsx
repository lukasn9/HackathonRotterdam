'use client'

import { useEffect, useRef, useState } from 'react'
import { SAMPLE_TRANSCRIPT } from '@/lib/transcript-data'

export default function TranscriptControls({ roomId }: { roomId: string; isPlayingInitial?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [busy, setBusy] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isFinishedRef = useRef(false)
  const roomIdRef = useRef(roomId)

  useEffect(() => { isFinishedRef.current = isFinished }, [isFinished])
  useEffect(() => { roomIdRef.current = roomId }, [roomId])

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function startInterval() {
    stopInterval()
    intervalRef.current = setInterval(async () => {
      if (isFinishedRef.current) { stopInterval(); return }
      try {
        const res = await fetch(`/api/room/${roomIdRef.current}/control`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'advance' }),
        })
        const data = await res.json()
        if (data.status === 'finished') {
          stopInterval()
          isFinishedRef.current = true
          setIsFinished(true)
          setIsPlaying(false)
        }
      } catch { /* ignore */ }
    }, 4000)
  }

  // On mount, fetch room state and resume if already playing
  useEffect(() => {
    fetch(`/api/room/${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.currentLineIndex >= SAMPLE_TRANSCRIPT.length - 1 && data.currentLineIndex >= 0) {
          setIsFinished(true)
          setIsPlaying(false)
        } else if (data.isPlaying) {
          setIsPlaying(true)
          startInterval()
        }
      })
      .catch(() => {})

    return () => stopInterval()
  }, [roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function send(action: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/room/${roomId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (action === 'start') {
        if (data.status === 'started') { setIsPlaying(true); startInterval() }
        if (data.status === 'transcript finished') { setIsFinished(true) }
      }
      if (action === 'pause') { stopInterval(); setIsPlaying(false) }
      if (action === 'reset') { stopInterval(); setIsPlaying(false); setIsFinished(false) }
    } catch { /* ignore */ }
    finally { setBusy(false) }
  }

  return (
    <div className="flex items-center gap-3">
      {isFinished ? (
        <button
          disabled
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-gray-600 rounded-lg font-medium cursor-not-allowed opacity-50"
        >
          ✓ Finished
        </button>
      ) : !isPlaying ? (
        <button
          onClick={() => send('start')}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-lg font-medium transition-colors"
        >
          ▶ Start
        </button>
      ) : (
        <button
          onClick={() => send('pause')}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 rounded-lg font-medium transition-colors"
        >
          ⏸ Pause
        </button>
      )}

      <button
        onClick={() => send('advance')}
        disabled={busy || isFinished}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
      >
        ⏭ Next Line
      </button>

      <button
        onClick={() => send('reset')}
        disabled={busy}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg font-medium transition-colors"
      >
        ↺ Reset
      </button>
    </div>
  )
}
