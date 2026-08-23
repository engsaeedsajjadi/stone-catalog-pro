export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { searchStones } from '@/lib/search'
import { rateLimit } from '@/lib/rate-limit'

/**
 * GET /api/search — جستجوی محصولات
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ success: true, data: [], mode: 'database' })
  }

  // محدودیت نرخ جستجو
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limited = await rateLimit(`search:${ip}`, 30, 60)
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
      { status: 429 }
    )
  }

  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 24), 100)
    const result = await searchStones(q, limit)

    return NextResponse.json({
      success: true,
      data: result.hits,
      mode: result.mode,
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'جستجو ناموفق بود' },
      { status: 500 }
    )
  }
}
