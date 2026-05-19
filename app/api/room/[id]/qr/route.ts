export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getRoomById } from '@/lib/store'
import QRCode from 'qrcode'
import os from 'os'

function getLanIp(): string | null {
  const ifaces = os.networkInterfaces()
  for (const iface of Object.values(ifaces)) {
    for (const info of iface ?? []) {
      if (info.family === 'IPv4' && !info.internal) return info.address
    }
  }
  return null
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const room = getRoomById(params.id)
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const requestUrl = new URL(req.url)
  const port = requestUrl.port || '3000'
  const lanIp = getLanIp()
  const base = process.env.NEXT_PUBLIC_BASE_URL
    || (lanIp ? `http://${lanIp}:${port}` : `http://localhost:${port}`)

  const url = `${base}/join/${room.accessCode}`
  const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })

  return NextResponse.json({ dataUrl, url })
}
