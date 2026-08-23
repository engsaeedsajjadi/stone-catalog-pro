export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MAX_IDS = 100

/**
 * دریافت چند محصول با شناسه.
 *
 * `/api/compare` سقف ۶ آیتم دارد و برای صفحه علاقه‌مندی‌ها کافی نیست.
 * این مسیر ترتیب درخواست را حفظ می‌کند و `inventory` را هم مثل بقیه‌ی UI
 * به یک آبجکت تخت تبدیل می‌کند.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const ids = (searchParams.get('ids') || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .slice(0, MAX_IDS)

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const stones = await db.stone.findMany({
      where: { id: { in: ids } },
      include: {
        category: true,
        images: { take: 1, orderBy: { order: 'asc' } },
        prices: { where: { isActive: true } },
        inventory: true,
      },
    })

    const byId = new Map(stones.map(stone => [stone.id, stone]))

    const ordered = ids
      .map(id => byId.get(id))
      .filter((stone): stone is (typeof stones)[number] => Boolean(stone))
      .map(stone => ({
        ...stone,
        inventory: Array.isArray(stone.inventory) ? stone.inventory[0] || null : stone.inventory,
      }))

    return NextResponse.json({ success: true, data: ordered })
  } catch (e) {
    console.error('GET /api/products/by-ids error:', e)
    return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
