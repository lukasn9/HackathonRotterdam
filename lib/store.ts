import { createServerClient } from './supabase'
import { SAMPLE_TRANSCRIPT } from './transcript-data'

export type FieldOfStudy = 'STEM' | 'Humanities' | 'Business' | 'Medicine'
export type ProficiencyLevel = 'Novice' | 'Intermediate' | 'Expert'
export type TranscriptLine = { text: string }

export type Attendee = {
  id: string
  name: string
  institution: string
  fieldOfStudy: FieldOfStudy
  proficiencyLevel: ProficiencyLevel
  joinedAt: Date
}

export type ReactionEvent = {
  id: string
  emoji: string
  attendeeName: string
  attendeeId: string
  lineIndex: number
  timestamp: Date
}

export type Room = {
  id: string
  accessCode: string
  title: string
  createdAt: Date
  currentLineIndex: number
  isPlaying: boolean
}

export async function createRoom(title: string): Promise<{ id: string; accessCode: string; title: string }> {
  const supabase = createServerClient()
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString()
  const { data, error } = await supabase
    .from('rooms')
    .insert({ access_code: accessCode, title })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, accessCode: data.access_code, title: data.title }
}

export async function getRoomById(id: string): Promise<Room | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    accessCode: data.access_code,
    title: data.title,
    createdAt: new Date(data.created_at),
    currentLineIndex: data.current_line_index,
    isPlaying: data.is_playing,
  }
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('access_code', code)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    accessCode: data.access_code,
    title: data.title,
    createdAt: new Date(data.created_at),
    currentLineIndex: data.current_line_index,
    isPlaying: data.is_playing,
  }
}

export async function addAttendee(roomId: string, attendee: Attendee): Promise<boolean> {
  const supabase = createServerClient()
  const { error } = await supabase.from('attendees').insert({
    id: attendee.id,
    room_id: roomId,
    name: attendee.name,
    institution: attendee.institution,
    field_of_study: attendee.fieldOfStudy,
    proficiency_level: attendee.proficiencyLevel,
  })
  return !error
}

export async function getAttendeeById(roomId: string, attendeeId: string): Promise<Attendee | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .eq('id', attendeeId)
    .eq('room_id', roomId)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    institution: data.institution,
    fieldOfStudy: data.field_of_study as FieldOfStudy,
    proficiencyLevel: data.proficiency_level as ProficiencyLevel,
    joinedAt: new Date(data.joined_at),
  }
}

export async function listAttendees(roomId: string): Promise<Attendee[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    institution: row.institution,
    fieldOfStudy: row.field_of_study as FieldOfStudy,
    proficiencyLevel: row.proficiency_level as ProficiencyLevel,
    joinedAt: new Date(row.joined_at),
  }))
}

export async function setReaction(
  roomId: string,
  attendeeId: string,
  attendeeName: string,
  emoji: string,
  lineIndex: number,
): Promise<boolean> {
  const supabase = createServerClient()
  const { error: e1 } = await supabase
    .from('current_reactions')
    .upsert({ attendee_id: attendeeId, room_id: roomId, emoji, updated_at: new Date().toISOString() })
  if (e1) return false
  const { error: e2 } = await supabase.from('reaction_events').insert({
    room_id: roomId,
    attendee_id: attendeeId,
    attendee_name: attendeeName,
    emoji,
    line_index: lineIndex,
  })
  return !e2
}

export async function clearReaction(roomId: string, attendeeId: string): Promise<void> {
  const supabase = createServerClient()
  await supabase
    .from('current_reactions')
    .delete()
    .eq('attendee_id', attendeeId)
    .eq('room_id', roomId)
}

export async function getReactionStats(roomId: string): Promise<{
  counts: Record<string, number>
  total: number
  respondents: number
}> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('current_reactions')
    .select('emoji')
    .eq('room_id', roomId)
  if (error || !data) return { counts: {}, total: 0, respondents: 0 }
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.emoji] = (counts[row.emoji] ?? 0) + 1
  }
  const total = data.length
  return { counts, total, respondents: total }
}

export async function getReactionTimeline(roomId: string): Promise<ReactionEvent[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('reaction_events')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id,
    emoji: row.emoji,
    attendeeName: row.attendee_name,
    attendeeId: row.attendee_id,
    lineIndex: row.line_index,
    timestamp: new Date(row.created_at),
  }))
}

// Returns the new index, or null if already at end / room not found
export async function advanceTranscript(
  id: string,
): Promise<{ status: 'advanced' | 'finished' | 'not_found'; index: number }> {
  const supabase = createServerClient()
  const { data: room, error } = await supabase
    .from('rooms')
    .select('current_line_index')
    .eq('id', id)
    .single()
  if (error || !room) return { status: 'not_found', index: -1 }

  const currentIndex: number = room.current_line_index
  const totalLines = SAMPLE_TRANSCRIPT.length

  if (currentIndex >= totalLines - 1) {
    await supabase.from('rooms').update({ is_playing: false }).eq('id', id)
    return { status: 'finished', index: currentIndex }
  }

  const nextIndex = currentIndex + 1
  const isLast = nextIndex >= totalLines - 1
  await supabase
    .from('rooms')
    .update({ current_line_index: nextIndex, ...(isLast ? { is_playing: false } : {}) })
    .eq('id', id)

  return { status: isLast ? 'finished' : 'advanced', index: nextIndex }
}

export function formatCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`
}
