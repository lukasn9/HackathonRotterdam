'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SpeakerHome() {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || 'My Presentation' }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/speaker/room/${data.id}`)
    } catch {
      setError('Failed to create room. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <div className="text-5xl mb-4">🎤</div>
          <h1 className="text-3xl font-bold">Speaker Dashboard</h1>
          <p className="mt-2 text-gray-400">Create a room to start your presentation</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Presentation title (optional)"
            maxLength={100}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-600 text-center"
            autoFocus
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>

        <a href="/" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← Back to audience view
        </a>
      </div>
    </main>
  )
}
