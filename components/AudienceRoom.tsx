'use client'

import { useState, useRef, useEffect } from 'react'
import TranscriptView from '@/components/TranscriptView'
import ChatPanel from '@/components/ChatPanel'
import EmojiReactions from '@/components/EmojiReactions'

const EMOJIS = [
  { emoji: '🔥', label: 'Excellent' },
  { emoji: '👍', label: 'Got it' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🤔', label: 'Confused' },
  { emoji: '😴', label: 'Too slow' },
]

const LOCK_MS = 5000

function FloatingReactions({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  async function handleReact(emoji: string) {
    if (locked) return
    setActive(emoji)
    setLocked(true)
    setOpen(false)
    setRemaining(LOCK_MS / 1000)

    try {
      await fetch(`/api/room/${roomId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
        credentials: 'include',
      })
    } catch { /* ignore */ }

    tickRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)

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
    <>
      {open && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Fixed container anchored to bottom-left; each button is absolute inside */}
      <div className="fixed bottom-6 left-6 z-40" style={{ width: 56, height: 56 }}>
        {EMOJIS.map(({ emoji, label }, i) => {
          const isActive = active === emoji
          // Collapsed: emojis peek above each other by 10px — stacked deck look
          // Open: each spreads 68px apart going upward
          const y = open ? -(i * 68) : -(i * 10)
          // Stagger: open bottom-to-top, close top-to-bottom
          const delay = open
            ? `${i * 0.04}s`
            : `${(EMOJIS.length - 1 - i) * 0.03}s`

          return (
            <button
              key={emoji}
              title={label}
              disabled={open && locked}
              onClick={() => {
                if (!open) { if (!locked) setOpen(true); return }
                handleReact(emoji)
              }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                zIndex: i + 1,
                transform: `translateY(${y}px)`,
                transition: `transform 0.35s cubic-bezier(0.34,1.4,0.64,1) ${delay}`,
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border select-none transition-all ${
                isActive
                  ? 'bg-blue-700/40 border-blue-500'
                  : locked
                  ? 'bg-gray-800/40 border-gray-800 opacity-30 cursor-not-allowed'
                  : 'bg-gray-800 border-gray-700 active:scale-95'
              }`}
            >
              <span className={isActive ? 'animate-bounce' : ''}>{emoji}</span>
            </button>
          )
        })}

        {/* Cooldown countdown badge */}
        {locked && (
          <div className="absolute -top-1 -right-1 z-50 bg-gray-900 text-gray-400 text-[10px] font-mono rounded-full w-5 h-5 flex items-center justify-center border border-gray-700 pointer-events-none">
            {remaining}
          </div>
        )}
      </div>
    </>
  )
}

type Props = {
  roomId: string
  roomTitle: string
  displayName: string
  profileTag: string
}

export default function AudienceRoom({ roomId, roomTitle, displayName, profileTag }: Props) {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden md:flex h-screen bg-gray-950 text-white">
        <div className="flex-1 flex flex-col overflow-hidden p-6 border-r border-gray-800">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="font-semibold text-lg">{roomTitle}</h1>
              <p className="text-xs text-gray-500">Welcome, {displayName}</p>
            </div>
            <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-md">{profileTag}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <TranscriptView roomId={roomId} />
          </div>
          <div className="flex-shrink-0 pt-4 border-t border-gray-800 mt-4">
            <EmojiReactions roomId={roomId} />
          </div>
        </div>
        <div className="w-96 flex flex-col p-6">
          <ChatPanel roomId={roomId} />
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="flex flex-col md:hidden h-screen bg-gray-950 text-white relative overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div>
            <h1 className="font-semibold leading-tight">{roomTitle}</h1>
            <p className="text-xs text-gray-500">{displayName}</p>
          </div>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-md shrink-0 ml-2">{profileTag}</span>
        </div>

        {/* Transcript — padded at bottom so content clears floating buttons */}
        <div className="flex-1 overflow-hidden pb-28">
          <TranscriptView roomId={roomId} />
        </div>

        {/* Floating stacked reactions — bottom-left */}
        <FloatingReactions roomId={roomId} />

        {/* Floating chat button — bottom-right */}
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 rounded-full shadow-xl flex items-center justify-center transition-colors"
          aria-label="Open chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="10" x2="15" y2="10" />
            <line x1="9" y1="14" x2="13" y2="14" />
          </svg>
        </button>

        {/* Chat backdrop */}
        <div
          className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${chatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setChatOpen(false)}
        />

        {/* Chat bottom sheet */}
        <div
          className={`fixed inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            chatOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ height: '78vh' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-700" />
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 flex-shrink-0">
            <span className="font-medium text-sm">Ask AI</span>
            <button
              onClick={() => setChatOpen(false)}
              className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <ChatPanel roomId={roomId} />
          </div>
        </div>
      </div>
    </>
  )
}
