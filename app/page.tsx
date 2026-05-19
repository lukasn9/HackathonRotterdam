'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setError('')
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/rooms/${code}`)
      if (!res.ok) {
        setError('Room not found. Check the code and try again.')
        return
      }
      router.push(`/join/${code}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const display = code.length > 3 ? `${code.slice(0, 3)}-${code.slice(3)}` : code

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <div className="text-5xl mb-4">🎙</div>
          <h1 className="text-3xl font-bold tracking-tight">Join a Presentation</h1>
          <p className="mt-2 text-gray-400">Enter the 6-digit code shown by your speaker</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleInput}
            placeholder="000-000"
            className="w-full text-center text-3xl font-mono tracking-widest bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-600"
            autoFocus
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
          >
            {loading ? 'Looking up...' : 'Join'}
          </button>
        </form>

        <div className="border-t border-gray-800 pt-6">
          <a
            href="/speaker"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Are you a speaker? Create a room →
          </a>
        </div>
      </div>
    </main>
  )
}
