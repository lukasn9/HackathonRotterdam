'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

function renderMarkdown(text: string) {
  return text.split('\n').filter(Boolean).map((line, i) => {
    const isBullet = /^[\*\-•]/.test(line.trim())
    const clean = line.replace(/^[\*\-•]\s*/, '')
    const parts = clean.split(/\*\*(.*?)\*\*/g)
    const rendered = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
    )
    return isBullet ? (
      <li key={i} className="flex gap-1.5 leading-relaxed">
        <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
        <span>{rendered}</span>
      </li>
    ) : (
      <p key={i} className="leading-relaxed">{rendered}</p>
    )
  })
}

export default function ChatPanel({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await fetch(`/api/room/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        credentials: 'include',
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer || data.error || 'No response.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to get a response. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleCatchMeUp() {
    if (loading) return
    setMessages((prev) => [...prev, { role: 'user', content: 'Catch me up on what I missed' }])
    setLoading(true)

    try {
      const res = await fetch(`/api/room/${roomId}/summary`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.summary || data.error || 'Could not generate summary.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to generate summary. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300 uppercase tracking-wider">Ask AI</span>
          <span className="text-xs text-gray-600">· personalized to you</span>
        </div>
        <button
          onClick={handleCatchMeUp}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Catch me up
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm">
            Ask anything about the presentation, or hit <span className="text-gray-500">Catch me up</span> if you joined late.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-blue-700 text-white rounded-br-sm leading-relaxed'
                  : 'bg-gray-800 text-gray-200 rounded-bl-sm'
              }`}
            >
              {m.role === 'assistant' ? (
                <ul className="space-y-1">{renderMarkdown(m.content)}</ul>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 placeholder:text-gray-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
