'use client'

import { useEffect, useState } from 'react'

const EMOJI_SCORE: Record<string, number> = {
  '🔥': 5,
  '👍': 4,
  '😮': 3,
  '🤔': 2,
  '😴': 1,
}

const EMOJIS = ['🔥', '👍', '😮', '🤔', '😴']

const SCORE_COLORS: Record<string, string> = {
  '🔥': 'bg-orange-500',
  '👍': 'bg-blue-500',
  '😮': 'bg-purple-500',
  '🤔': 'bg-amber-500',
  '😴': 'bg-gray-500',
}

function scoreToMeta(score: number): { emoji: string; label: string; color: string } {
  if (score >= 4.5) return { emoji: '🔥', label: 'Excellent',  color: 'text-orange-400' }
  if (score >= 3.5) return { emoji: '👍', label: 'Good',       color: 'text-blue-400' }
  if (score >= 2.5) return { emoji: '😮', label: 'Mixed',      color: 'text-purple-400' }
  if (score >= 1.5) return { emoji: '🤔', label: 'Confused',   color: 'text-amber-400' }
  return              { emoji: '😴', label: 'Disengaged', color: 'text-gray-400' }
}

function weightedAverage(events: TimelineEvent[]): number {
  if (!events.length) return 0
  return events.reduce((sum, e) => sum + (EMOJI_SCORE[e.emoji] ?? 3), 0) / events.length
}

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
  isFinished: boolean
}

function ScoreBadge({ score, sublabel }: { score: number; sublabel: string }) {
  const meta = scoreToMeta(score)
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl mb-1">{meta.emoji}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold tabular-nums ${meta.color}`}>{score.toFixed(1)}</span>
        <span className="text-gray-600 text-sm">/5</span>
      </div>
      <span className={`text-xs font-medium mt-0.5 ${meta.color}`}>{meta.label}</span>
      <span className="text-[10px] text-gray-600 mt-1">{sublabel}</span>
    </div>
  )
}

function SentimentGraph({ events }: { events: TimelineEvent[] }) {
  if (events.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-gray-700 text-xs">
        Not enough data to plot
      </div>
    )
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const startMs = new Date(sorted[0].timestamp).getTime()
  const endMs   = new Date(sorted[sorted.length - 1].timestamp).getTime()
  const span    = endMs - startMs || 1

  const W = 400, H = 80, PAD = 4
  const pts = sorted.map((e) => {
    const x = PAD + ((new Date(e.timestamp).getTime() - startMs) / span) * (W - PAD * 2)
    const score = EMOJI_SCORE[e.emoji] ?? 3
    const y = PAD + ((5 - score) / 4) * (H - PAD * 2)
    return { x, y, score }
  })

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 96 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[1, 3, 5].map((s) => {
        const y = PAD + ((5 - s) / 4) * (H - PAD * 2)
        return <line key={s} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#374151" strokeWidth="0.5" />
      })}
      <polygon
        points={`${pts[0].x},${H} ${polyline} ${pts[pts.length - 1].x},${H}`}
        fill="url(#sg-fill)"
      />
      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle
          key={i} cx={p.x} cy={p.y} r="3"
          fill={p.score >= 4 ? '#f97316' : p.score >= 3 ? '#3b82f6' : p.score >= 2 ? '#f59e0b' : '#6b7280'}
          stroke="#111827" strokeWidth="1"
        />
      ))}
    </svg>
  )
}

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  return `${Math.floor(diff / 60)}m ago`
}

export default function ReactionStats({ roomId }: { roomId: string }) {
  const [data, setData] = useState<ReactionData>({
    counts: {}, total: 0, respondents: 0, timeline: [], isFinished: false,
  })
  const [, setTick] = useState(0)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`/api/room/${roomId}/reactions`)
        if (res.ok) setData(await res.json())
      } catch { /* ignore */ }
    }
    fetch_()
    const poll = setInterval(fetch_, 3000)
    const tick = setInterval(() => setTick((n) => n + 1), 1000)
    return () => { clearInterval(poll); clearInterval(tick) }
  }, [roomId])

  const allEvents = [...data.timeline].reverse()

  const cutoff = Date.now() - 60_000
  const recentEvents = allEvents.filter((e) => new Date(e.timestamp).getTime() >= cutoff)

  const overallScore = weightedAverage(allEvents)
  const recentScore  = weightedAverage(recentEvents)
  const displayScore = data.isFinished
    ? overallScore
    : recentEvents.length > 0 ? recentScore : overallScore

  const scoreSublabel = data.isFinished
    ? `Overall · ${allEvents.length} reaction${allEvents.length !== 1 ? 's' : ''}`
    : recentEvents.length > 0
      ? `Last 60s · ${recentEvents.length} reaction${recentEvents.length !== 1 ? 's' : ''}`
      : `All-time · no recent activity`

  const hasData = allEvents.length > 0

  // Confusion alert (live only)
  const confusedPct = recentEvents.length > 0
    ? Math.round((recentEvents.filter((e) => e.emoji === '🤔').length / recentEvents.length) * 100)
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          {data.isFinished ? 'Presentation Summary' : 'Live Reactions'}
        </h3>
        <span className="text-xs text-gray-600">
          {data.isFinished
            ? `${allEvents.length} total reactions`
            : `${data.respondents} responding now`}
        </span>
      </div>

      {!hasData ? (
        <p className="text-gray-700 text-sm text-center py-8">No reactions yet</p>
      ) : (
        <div className={`grid gap-6 ${data.isFinished ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>

          {/* Score + breakdown */}
          <div className="flex flex-col items-center gap-4">
            <ScoreBadge score={displayScore} sublabel={scoreSublabel} />

            <div className="flex gap-1.5 w-full">
              {EMOJIS.map((emoji) => {
                const count = data.counts[emoji] ?? 0
                return (
                  <div key={emoji} className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg py-2 ${count > 0 ? 'bg-gray-700/60' : 'bg-gray-800/20'}`}>
                    <span className="text-base">{emoji}</span>
                    <span className={`text-xs font-bold tabular-nums ${count > 0 ? 'text-white' : 'text-gray-700'}`}>{count}</span>
                  </div>
                )
              })}
            </div>

            {data.total > 0 && (
              <div className="w-full space-y-1">
                {EMOJIS.filter((e) => (data.counts[e] ?? 0) > 0).map((emoji) => {
                  const count = data.counts[emoji] ?? 0
                  const pct = Math.round((count / data.respondents) * 100)
                  return (
                    <div key={emoji} className="flex items-center gap-2">
                      <span className="text-xs w-5 text-center">{emoji}</span>
                      <div className="flex-1 bg-gray-900 rounded-full h-1.5">
                        <div className={`${SCORE_COLORS[emoji]} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-600 w-7 text-right tabular-nums">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sentiment graph — finished mode only */}
          {data.isFinished && (
            <div className="flex flex-col justify-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Sentiment over time</p>
              <SentimentGraph events={allEvents} />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-700">Start</span>
                <span className="text-[10px] text-gray-700">End</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[10px] text-gray-700">😴 1</span>
                <span className="text-[10px] text-gray-700">😮 3</span>
                <span className="text-[10px] text-gray-700">🔥 5</span>
              </div>
            </div>
          )}

          {/* Timeline feed */}
          <div className="flex flex-col">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Timeline</p>
            {data.timeline.length === 0 ? (
              <p className="text-gray-700 text-xs text-center py-4">No entries yet</p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {data.timeline.map((event) => (
                  <div key={event.id} className="flex items-center gap-2 bg-gray-900/60 rounded-lg px-2.5 py-1.5">
                    <span className="text-base flex-shrink-0">{event.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-300 truncate block">{event.attendeeName}</span>
                      {event.lineIndex >= 0 && (
                        <span className="text-[10px] text-gray-700">line {event.lineIndex + 1}</span>
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
      )}

      {!data.isFinished && confusedPct >= 30 && (
        <div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <span>🤔</span>
          <p className="text-xs text-amber-400">
            <span className="font-semibold">{confusedPct}%</span> confused in the last minute — consider slowing down
          </p>
        </div>
      )}
    </div>
  )
}
