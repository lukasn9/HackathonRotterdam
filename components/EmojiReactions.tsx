'use client'

import { useEffect, useRef, useState } from 'react'

const EMOJIS: { emoji: string; label: string }[] = [
  { emoji: '🔥', label: 'Excellent' },
  { emoji: '👍', label: 'Got it' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🤔', label: 'Confused' },
  { emoji: '😴', label: 'Too slow' },
]

const LOCK_MS = 5000

export default function EmojiReactions({ roomId }: { roomId: string }) {
  const [active, setActive] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  async function handleReact(emoji: string) {
    if (locked) return

    // Optimistic lock
    setActive(emoji)
    setLocked(true)
    setRemaining(LOCK_MS / 1000)

    // POST reaction
    try {
      await fetch(`/api/room/${roomId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
        credentials: 'include',
      })
    } catch { /* ignore */ }

    // Countdown tick
    tickRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)

    // Auto-unlock + clear after LOCK_MS
    timerRef.current = setTimeout(async () => {
      if (tickRef.current) clearInterval(tickRef.current)
      setActive(null)
      setLocked(false)
      setRemaining(0)
      try {
        await fetch(`/api/room/${roomId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clear: true }),
          credentials: 'include',
        })
      } catch { /* ignore */ }
    }, LOCK_MS)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-600 uppercase tracking-wider">How&apos;s it going?</p>
        {locked && (
          <span className="text-xs text-gray-600 tabular-nums">reacts again in {remaining}s</span>
        )}
      </div>
      <div className="flex gap-2">
        {EMOJIS.map(({ emoji, label }) => {
          const isActive = active === emoji
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              disabled={locked}
              title={label}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-200 select-none ${
                isActive
                  ? 'border-indigo-500 bg-indigo-500/20 scale-110 shadow-lg shadow-indigo-500/20'
                  : locked
                  ? 'border-gray-800 bg-gray-800/40 opacity-40 cursor-not-allowed'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500 hover:scale-105 cursor-pointer'
              }`}
            >
              <span className={`text-2xl leading-none ${isActive ? 'animate-bounce' : ''}`}>{emoji}</span>
              <span className="text-[10px] text-gray-500">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
