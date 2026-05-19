export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

// Replaced by Supabase Realtime — clients subscribe directly via TranscriptView
export async function GET() {
  return NextResponse.json({ error: 'SSE stream replaced by Supabase Realtime' }, { status: 410 })
}
