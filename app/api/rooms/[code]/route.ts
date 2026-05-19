export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getRoomByCode } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const code = params.code.replace(/\D/g, '')
  const room = await getRoomByCode(code)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  return NextResponse.json({ id: room.id, accessCode: room.accessCode, title: room.title })
}
