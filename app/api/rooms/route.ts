export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createRoom } from '@/lib/store'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled Presentation'
  const room = await createRoom(title)
  return NextResponse.json({ id: room.id, accessCode: room.accessCode, title: room.title })
}
