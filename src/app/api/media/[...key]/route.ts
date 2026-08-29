export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readStoredFile } from '@/lib/storage'

type RouteContext = {
  params: Promise<{
    key: string[]
  }>
}

export async function GET(
  _req: Request,
  { params }: RouteContext
) {
  try {
    const { key } = await params

    if (!key || key.length === 0) {
      return new NextResponse('Not Found', {
        status: 404,
      })
    }

    const storageKey = key.join('/')

    const asset =
      await db.mediaAsset.findUnique({
        where: {
          storageKey,
        },
      })

    if (!asset) {
      return new NextResponse('Not Found', {
        status: 404,
      })
    }

    const stored =
      await readStoredFile(storageKey)

    if (
      !stored ||
      !stored.data ||
      stored.data.length === 0
    ) {
      return new NextResponse('File Empty', {
        status: 404,
      })
    }

    const contentType =
      stored.contentType ||
      asset.mimeType ||
      'application/octet-stream'

    const responseHeaders =
      new Headers()

    responseHeaders.set(
      'Content-Type',
      contentType
    )

    responseHeaders.set(
      'Content-Length',
      String(stored.data.length)
    )

    responseHeaders.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )

    return new NextResponse(
      new Uint8Array(stored.data),
      {
        status: 200,
        headers: responseHeaders,
      }
    )
  } catch (error) {
    console.error(
      '[MEDIA] Error:',
      error
    )

    return new NextResponse('Not Found', {
      status: 404,
    })
  }
}