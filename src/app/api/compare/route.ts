export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeStones } from '@/lib/stone-serialize'
import { getViewer } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

// Compare multiple stones side by side
export async function GET(req: NextRequest) {
  try {
    const limited = await rateLimit(`compare:${getClientIp(req)}`, 60, 60)
    if (!limited.allowed) {
      return NextResponse.json({ success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' }, { status: 429 })
    }

    const viewer = await getViewer(req)
    const serializeOptions = { restrictPrices: !viewer.isAuthenticated }

    const { searchParams } = new URL(req.url)
    const ids = (searchParams.get('ids')?.split(',').filter(Boolean) || []).slice(0, 6)
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
      ids.map(id => stones.find(s => s.id === id)).filter(Boolean) as Record<string, any>[],
      serializeOptions
    )

    return NextResponse.json({ success: true, data: ordered })
  } catch (e) {
    console.error('GET /api/compare error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
