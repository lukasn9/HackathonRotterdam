export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById, advanceTranscript } from '@/lib/store'
import { SAMPLE_TRANSCRIPT } from '@/lib/transcript-data'
import { createServerClient } from '@/lib/supabase'

const TOTAL_LINES = SAMPLE_TRANSCRIPT.length

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const room = await getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const action = body.action as string
  const supabase = createServerClient()

  if (action === 'start') {
    if (room.currentLineIndex >= TOTAL_LINES - 1) {
      return NextResponse.json({ status: 'transcript finished' })
    }
    await supabase.from('rooms').update({ is_playing: true }).eq('id', params.id)
    return NextResponse.json({ status: 'started' })
  }

  if (action === 'pause') {
    await supabase.from('rooms').update({ is_playing: false }).eq('id', params.id)
    return NextResponse.json({ status: 'paused' })
  }

  if (action === 'advance') {
    const result = await advanceTranscript(params.id)
    if (result.status === 'not_found') return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    return NextResponse.json({ status: result.status, index: result.index })
  }

  if (action === 'reset') {
    await supabase
      .from('rooms')
      .update({ current_line_index: -1, is_playing: false })
      .eq('id', params.id)
    return NextResponse.json({ status: 'reset' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
