'use client'

import { useEffect, useState } from 'react'

const EMOJIS: { emoji: string; label: string; color: string }[] = [
  { emoji: '🔥', label: 'Excellent', color: 'bg-orange-500' },
  { emoji: '👍', label: 'Got it',    color: 'bg-blue-500' },
  { emoji: '😮', label: 'Wow',       color: 'bg-purple-500' },
  { emoji: '🤔', label: 'Confused',  color: 'bg-amber-500' },
  { emoji: '😴', label: 'Too slow',  color: 'bg-gray-500' },
]

type TimelineEvent = {
  id: string
  emoji: string
  attendeeName: string
  lineIndex: number
  timestamp: string
}

type ReactionData = {
  counts: Record<string, number>
  total: number
  respondents: number
  timeline: TimelineEvent[]
}

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  return `${Math.floor(diff / 60)}m ago`
}

export default function ReactionStats({ roomId }: { roomId: string }) {
  const [data, setData] = useState<ReactionData>({ counts: {}, total: 0, respondents: 0, timeline: [] })
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`/api/room/${roomId}/reactions`)
        if (res.ok) setData(await res.json())
      } catch { /* ignore */ }
    }
    fetch_()
    const poll = setInterval(fetch_, 3000)
    // Tick "time ago" labels every second
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(poll); clearInterval(tick) }
  }, [roomId])

  const confusedCount = data.counts['🤔'] ?? 0
  const confusionPct = data.respondents > 0 ? Math.round((confusedCount / data.respondents) * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: current pulse */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Live Reactions</h3>
          <span className="text-xs text-gray-600">{data.respondents} active now</span>
        </div>

        <div className="flex gap-2 mb-4">
          {EMOJIS.map(({ emoji, label }) => {
            const count = data.counts[emoji] ?? 0
            return (
              <div
                key={emoji}
                className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-3 transition-all duration-300 ${
                  count > 0 ? 'bg-gray-700/70' : 'bg-gray-800/30'
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className={`text-lg font-bold tabular-nums ${count > 0 ? 'text-white' : 'text-gray-700'}`}>
                  {count}
                </span>
                <span className="text-[9px] text-gray-500 text-center leading-tight">{label}</span>
              </div>
            )
          })}
        </div>

        {data.total > 0 && (
          <div className="space-y-1.5">
            {EMOJIS.filter(({ emoji }) => (data.counts[emoji] ?? 0) > 0).map(({ emoji, color }) => {
              const count = data.counts[emoji] ?? 0
              const pct = Math.round((count / data.respondents) * 100)
              return (
                <div key={emoji} className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center">{emoji}</span>
                  <div className="flex-1 bg-gray-900 rounded-full h-1.5">
                    <div
                      className={`${color} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-7 text-right tabular-nums">{pct}%</span>
                </div>
              )
            })}
          </div>
        )}

        {confusionPct >= 30 && (
          <div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            <span>🤔</span>
            <p className="text-xs text-amber-400">
              <span className="font-semibold">{confusionPct}%</span> confused — consider slowing down
            </p>
          </div>
        )}

        {data.respondents === 0 && (
          <p className="text-gray-700 text-sm text-center py-6">No reactions yet</p>
        )}
      </div>

      {/* Right: timeline feed */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Reaction Timeline
        </h3>
        {data.timeline.length === 0 ? (
          <p className="text-gray-700 text-sm text-center py-6">Timeline empty</p>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {data.timeline.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-2.5 bg-gray-900/60 rounded-lg px-3 py-2"
              >
                <span className="text-lg flex-shrink-0">{event.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-200 truncate block">{event.attendeeName}</span>
                  {event.lineIndex >= 0 && (
                    <span className="text-[10px] text-gray-600">line {event.lineIndex + 1}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 flex-shrink-0 tabular-nums">
                  {timeAgo(event.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
