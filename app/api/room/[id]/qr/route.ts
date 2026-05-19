export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/store'
import QRCode from 'qrcode'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const url = `${base}/join/${room.accessCode}`
  const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })

  return NextResponse.json({ dataUrl })
}
