export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/ai/recommend — پیشنهاد محصولات مرتبط
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('response' in auth) return auth.response

  try {
    const stoneId = req.nextUrl.searchParams.get('stoneId')
    if (!stoneId) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است' },
        { status: 400 }
      )
    }

    const recommendations = await db.recommendation.findMany({
      where: { stoneId },
      orderBy: { score: 'desc' },
      take: 6,
    })

    if (recommendations.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const recommendedStones = await db.stone.findMany({
      where: {
        id: { in: recommendations.map((r) => r.recommendedStoneId) },
      },
      include: {
        images: { take: 1 },
        category: true,
        prices: { where: { isActive: true }, take: 1 },
      },
    })

    return NextResponse.json({ success: true, data: recommendedStones })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'دریافت پیشنهاد ناموفق بود' },
      { status: 500 }
    )
  }
}
