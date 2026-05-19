'use client'

import { useEffect, useState } from 'react'

export default function TranscriptControls({ roomId, isPlayingInitial = false }: { roomId: string; isPlayingInitial?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(isPlayingInitial)
  const [isFinished, setIsFinished] = useState(false)
  const [busy, setBusy] = useState(false)

  // Poll room state to detect when auto-play reaches the last line
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.currentLineIndex >= data.totalLines - 1 && data.totalLines > 0) {
          setIsFinished(true)
          setIsPlaying(false)
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(poll)
  }, [roomId])

  async function send(action: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/room/${roomId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (action === 'start' && data.status === 'started') setIsPlaying(true)
      if (action === 'start' && data.status === 'transcript finished') setIsFinished(true)
      if (action === 'pause') setIsPlaying(false)
      if (action === 'reset') { setIsPlaying(false); setIsFinished(false) }
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
