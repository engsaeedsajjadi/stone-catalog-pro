export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeStones } from '@/lib/stone-serialize'

// Compare multiple stones side by side
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 })
    }
    if (ids.length > 6) {
      return NextResponse.json({ success: false, error: 'Max 6 stones to compare' }, { status: 400 })
    }

    const stones = await db.stone.findMany({
      where: { id: { in: ids } },
      include: {
        category: true,
        images: { take: 1, orderBy: { order: 'asc' } },
        prices: { where: { isActive: true } },
        inventory: { include: { warehouse: true } },
      },
    })

    // Preserve order from request
    const ordered = serializeStones(
      ids.map(id => stones.find(s => s.id === id)).filter(Boolean) as Record<string, any>[]
    )

    return NextResponse.json({ success: true, data: ordered })
  } catch (e) {
    console.error('GET /api/compare error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
