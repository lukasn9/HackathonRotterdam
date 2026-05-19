'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type FieldOfStudy = 'STEM' | 'Humanities' | 'Business' | 'Medicine'
type ProficiencyLevel = 'Novice' | 'Intermediate' | 'Expert'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).replace(/\D/g, '')

  const [room, setRoom] = useState<{ id: string; title: string } | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [fieldOfStudy, setFieldOfStudy] = useState<FieldOfStudy>('STEM')
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('Intermediate')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/rooms/${code}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setRoom(data))
      .catch(() => setNotFound(true))
  }, [code])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!room) return
    if (!name.trim()) { setError('Name is required.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/room/${room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, institution, fieldOfStudy, proficiencyLevel }),
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to join.')
        return
      }
      router.push(`/room/${room.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-2xl">Room not found</p>
          <a href="/" className="text-blue-400 hover:underline">← Back to home</a>
        </div>
      </main>
    )
  }

  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading room...</div>
      </main>
    )
  }

  const fields: FieldOfStudy[] = ['STEM', 'Humanities', 'Business', 'Medicine']
  const levels: ProficiencyLevel[] = ['Novice', 'Intermediate', 'Expert']

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="text-4xl mb-3">👤</div>
          <h1 className="text-2xl font-bold">{room.title}</h1>
          <p className="text-gray-400 mt-1">Tell us a bit about yourself to personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700 placeholder:text-gray-600"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Institution</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="University, company, etc."
              maxLength={100}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700 placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Field of Study</label>
            <select
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value as FieldOfStudy)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              {fields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Proficiency Level</label>
            <div className="flex gap-2">
              {levels.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setProficiencyLevel(l)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    proficiencyLevel === l
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
          >
            {submitting ? 'Joining...' : 'Enter Presentation'}
          </button>
        </form>
      </div>
    </main>
  )
}
