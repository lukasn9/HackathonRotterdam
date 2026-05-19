'use client'

type Attendee = {
  fieldOfStudy: string
  proficiencyLevel: string
}

const FIELDS = ['STEM', 'Humanities', 'Business', 'Medicine']
const LEVELS = ['Novice', 'Intermediate', 'Expert']

const FIELD_COLORS: Record<string, string> = {
  STEM: 'bg-blue-500',
  Humanities: 'bg-purple-500',
  Business: 'bg-amber-500',
  Medicine: 'bg-rose-500',
}

const LEVEL_COLORS: Record<string, string> = {
  Novice: 'bg-green-500',
  Intermediate: 'bg-yellow-500',
  Expert: 'bg-red-500',
}

function BarChart({ data, colors }: { data: Record<string, number>; colors: Record<string, string> }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0)
  const keys = Object.keys(data).filter((k) => data[k] > 0)
  if (total === 0) return <p className="text-gray-600 text-sm">No data yet</p>

  return (
    <div className="space-y-2">
      {keys.map((key) => {
        const pct = Math.round((data[key] / total) * 100)
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-24 shrink-0">{key}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2">
              <div
                className={`${colors[key] || 'bg-gray-500'} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{data[key]}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function DemographicsChart({ attendees }: { attendees: Attendee[] }) {
  const fieldCounts: Record<string, number> = Object.fromEntries(FIELDS.map((f) => [f, 0]))
  const levelCounts: Record<string, number> = Object.fromEntries(LEVELS.map((l) => [l, 0]))

  for (const a of attendees) {
    if (fieldCounts[a.fieldOfStudy] !== undefined) fieldCounts[a.fieldOfStudy]++
    if (levelCounts[a.proficiencyLevel] !== undefined) levelCounts[a.proficiencyLevel]++
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Field of Study</h4>
        <BarChart data={fieldCounts} colors={FIELD_COLORS} />
      </div>
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Proficiency Level</h4>
        <BarChart data={levelCounts} colors={LEVEL_COLORS} />
      </div>
    </div>
  )
}
