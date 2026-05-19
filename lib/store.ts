import { SAMPLE_TRANSCRIPT } from './transcript-data'
import { randomUUID } from 'crypto'

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

export type SSEClient = {
  id: string
  controller: ReadableStreamDefaultController
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
  transcript: TranscriptLine[]
  currentLineIndex: number
  isPlaying: boolean
  playbackInterval?: ReturnType<typeof setInterval>
  attendees: Map<string, Attendee>
  sseClients: Set<SSEClient>
  // One emoji per attendee; auto-cleared after 5s (reflects current pulse)
  reactions: Map<string, string>
  // Append-only log of every reaction click, newest last, capped at 50
  reactionTimeline: ReactionEvent[]
  // Topic label → questions array (capped at 10 per topic)
  questionTopics: Record<string, string[]>
}

// Survive Next.js hot reloads in dev
const g = globalThis as typeof globalThis & { __rooms?: Map<string, Room> }
if (!g.__rooms) g.__rooms = new Map()
export const rooms: Map<string, Room> = g.__rooms

export function createRoom(title: string): Room {
  const id = randomUUID()
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString()
  const room: Room = {
    id,
    accessCode,
    title,
    createdAt: new Date(),
    transcript: [...SAMPLE_TRANSCRIPT],
    currentLineIndex: -1,
    isPlaying: false,
    attendees: new Map(),
    sseClients: new Set(),
    reactions: new Map(),
    reactionTimeline: [],
    questionTopics: {},
  }
  rooms.set(id, room)
  return room
}

export function getRoomById(id: string): Room | undefined {
  return rooms.get(id)
}

export function getRoomByCode(code: string): Room | undefined {
  for (const room of Array.from(rooms.values())) {
    if (room.accessCode === code) return room
  }
  return undefined
}

export function addAttendee(roomId: string, attendee: Attendee): boolean {
  const room = rooms.get(roomId)
  if (!room) return false
  room.attendees.set(attendee.id, attendee)
  return true
}

export function broadcastToRoom(roomId: string, data: object): void {
  const room = rooms.get(roomId)
  if (!room) return
  const payload = `data: ${JSON.stringify(data)}\n\n`
  const toRemove: SSEClient[] = []
  for (const client of Array.from(room.sseClients)) {
    try {
      client.controller.enqueue(new TextEncoder().encode(payload))
    } catch {
      toRemove.push(client)
    }
  }
  for (const client of toRemove) room.sseClients.delete(client)
}

export function setReaction(roomId: string, attendeeId: string, emoji: string): boolean {
  const room = rooms.get(roomId)
  if (!room) return false
  const attendee = room.attendees.get(attendeeId)
  room.reactions.set(attendeeId, emoji)
  // Append to timeline (cap at 50)
  const event: ReactionEvent = {
    id: randomUUID(),
    emoji,
    attendeeName: attendee?.name ?? 'Guest',
    attendeeId,
    lineIndex: room.currentLineIndex,
    timestamp: new Date(),
  }
  room.reactionTimeline.push(event)
  if (room.reactionTimeline.length > 50) room.reactionTimeline.shift()
  return true
}

export function clearReaction(roomId: string, attendeeId: string): void {
  const room = rooms.get(roomId)
  if (room) room.reactions.delete(attendeeId)
}

export function getReactionCounts(roomId: string): Record<string, number> {
  const room = rooms.get(roomId)
  if (!room) return {}
  const counts: Record<string, number> = {}
  for (const emoji of Array.from(room.reactions.values())) {
    counts[emoji] = (counts[emoji] ?? 0) + 1
  }
  return counts
}

export function recordTopic(roomId: string, topic: string, question: string): void {
  const room = rooms.get(roomId)
  if (!room) return
  const key = topic.trim()
  if (!key) return
  if (!room.questionTopics[key]) room.questionTopics[key] = []
  if (room.questionTopics[key].length < 10) room.questionTopics[key].push(question)
}

export function formatCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`
}
