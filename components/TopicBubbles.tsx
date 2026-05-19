'use client'

import { useEffect, useState } from 'react'

type Topic = { label: string; count: number; questions: string[] }

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
]

const W = 480
const H = 220
const MIN_R = 28
const MAX_R = 72

function layoutBubbles(topics: Topic[]): { x: number; y: number; r: number; topic: Topic }[] {
  if (topics.length === 0) return []

  const maxCount = Math.max(...topics.map((t) => t.count))

  const bubbles = topics.map((topic) => ({
    topic,
    r: MIN_R + (MAX_R - MIN_R) * Math.sqrt(topic.count / maxCount),
  }))

  // Simple left-to-right row layout, centred vertically
  const totalWidth = bubbles.reduce((s, b) => s + b.r * 2, 0) + (bubbles.length - 1) * 12
  let x = (W - totalWidth) / 2

  return bubbles.map((b) => {
    const cx = x + b.r
    x += b.r * 2 + 12
    return { x: cx, y: H / 2, r: b.r, topic: b.topic }
  })
}

const MAX_QUESTIONS_SHOWN = 8

export default function TopicBubbles({ roomId }: { roomId: string }) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selected, setSelected] = useState<Topic | null>(null)

  useEffect(() => {
    function fetch_() {
      fetch(`/api/room/${roomId}/topics`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.topics) setTopics(d.topics) })
        .catch(() => {})
    }
    fetch_()
    const interval = setInterval(fetch_, 4000)
    return () => clearInterval(interval)
  }, [roomId])

  const placed = layoutBubbles(topics)

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Unclear Topics
      </h3>
      {topics.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-6">
          Topics will appear as attendees ask questions
        </p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          {placed.map(({ x, y, r, topic }, i) => (
            <g
              key={topic.label}
              onClick={() => setSelected(selected?.label === topic.label ? null : topic)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={x} cy={y} r={r}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={selected?.label === topic.label ? 1 : 0.85}
                stroke={selected?.label === topic.label ? 'white' : 'none'}
                strokeWidth={2}
              />
              {/* count badge */}
              <circle cx={x + r * 0.6} cy={y - r * 0.6} r={10} fill="#111827" />
              <text
                x={x + r * 0.6} y={y - r * 0.6}
                textAnchor="middle" dominantBaseline="central"
                fontSize={9} fontWeight="bold" fill="white"
              >
                {topic.count}
              </text>
              {/* label — two lines if needed */}
              {r >= 40 ? (
                <>
                  {topic.label.split(' ').map((word, wi, arr) => (
                    <text
                      key={wi}
                      x={x} y={y + (wi - (arr.length - 1) / 2) * 13}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={11} fontWeight="600" fill="white"
                    >
                      {word}
                    </text>
                  ))}
                </>
              ) : (
                <text
                  x={x} y={y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={9} fontWeight="600" fill="white"
                >
                  {topic.label.length > 10 ? topic.label.slice(0, 9) + '…' : topic.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
      {selected && (
        <div className="mt-4 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">{selected.label}</p>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              ✕ close
            </button>
          </div>
          <ul className="space-y-1">
            {selected.questions.slice(0, MAX_QUESTIONS_SHOWN).map((q, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-gray-600 shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
          {selected.questions.length > MAX_QUESTIONS_SHOWN && (
            <p className="text-xs text-gray-600 mt-2">
              +{selected.questions.length - MAX_QUESTIONS_SHOWN} more
            </p>
          )}
        </div>
      )}
    </div>
  )
}
