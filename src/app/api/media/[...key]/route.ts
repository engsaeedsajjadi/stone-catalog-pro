export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readStoredFile } from '@/lib/storage'

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await params
    const storageKey = key.join('/')
    const asset = await db.mediaAsset.findUnique({ where: { storageKey } })
    if (!asset) return new NextResponse('Not Found', { status: 404 })
    const stored = await readStoredFile(storageKey)
    const data = new Uint8Array(stored.data)
    return new NextResponse(data, { headers: { 'Content-Type': stored.contentType || asset.mimeType, 'Cache-Control': 'public, max-age=31536000, immutable', 'Content-Length': String(data.byteLength) } })
  } catch { return new NextResponse('Not Found', { status: 404 }) }
}
