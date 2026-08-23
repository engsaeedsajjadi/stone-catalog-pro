export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response

  // محدودیت نرخ داشبورد
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limited = await rateLimit(`dashboard:${ip}`, 30, 60)
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
      { status: 429 }
    )
  }
  try {
    const [
      totalStones,
      totalCustomers,
      totalInquiries,
      newInquiries,
      pendingInquiries,
      wonInquiries,
      totalInventoryValue,
      recentInquiries,
      topStones,
      inquiriesByStatus,
      inquiriesByDay,
    ] = await Promise.all([
      db.stone.count(),
      db.customer.count(),
      db.inquiry.count(),
      db.inquiry.count({ where: { status: 'NEW' } }),
      db.inquiry.count({ where: { status: { in: ['NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATING'] } } }),
      db.inquiry.count({ where: { status: 'WON' } }),
      db.inventory.aggregate({ _sum: { totalSqm: true, availableSqm: true } }),
      db.inquiry.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { stone: { select: { name: true, code: true, images: { take: 1 } } } },
      }),
      db.stone.findMany({
        take: 8,
        orderBy: { viewCount: 'desc' },
        include: { images: { take: 1 }, category: true, prices: { where: { isActive: true }, take: 1 } },
      }),
      db.inquiry.groupBy({ by: ['status'], _count: true }),
      // Last 14 days inquiry trend — یک کوئری به‌جای ۱۴ کوئری
      (async () => {
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setHours(0, 0, 0, 0)
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)

        const rows = await db.inquiry.groupBy({
          by: ['createdAt'],
          where: { createdAt: { gte: fourteenDaysAgo } },
          _count: true,
        })

        // گروه‌بندی بر اساس تاریخ (بدون ساعت)
        const countsByDate = new Map<string, number>()
        for (const row of rows) {
          const date = new Date(row.createdAt).toISOString().slice(0, 10)
          countsByDate.set(date, (countsByDate.get(date) || 0) + row._count)
        }

        // تکمیل روزهای بدون استعلام
        const days: Array<{ date: string; count: number }> = []
        for (let i = 13; i >= 0; i--) {
          const d = new Date()
          d.setHours(0, 0, 0, 0)
          d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          days.push({ date: key, count: countsByDate.get(key) || 0 })
        }
        return days
      })(),
    ])


    const now = new Date()
    const currentStart = new Date(now); currentStart.setDate(now.getDate()-30)
    const previousStart = new Date(now); previousStart.setDate(now.getDate()-60)
    const [curStones, prevStones, curCustomers, prevCustomers, curInquiries, prevInquiries, curWon, prevWon] = await Promise.all([
      db.stone.count({where:{createdAt:{gte:currentStart}}}), db.stone.count({where:{createdAt:{gte:previousStart,lt:currentStart}}}),
      db.customer.count({where:{createdAt:{gte:currentStart}}}), db.customer.count({where:{createdAt:{gte:previousStart,lt:currentStart}}}),
      db.inquiry.count({where:{createdAt:{gte:currentStart}}}), db.inquiry.count({where:{createdAt:{gte:previousStart,lt:currentStart}}}),
      db.inquiry.count({where:{createdAt:{gte:currentStart},status:'WON'}}), db.inquiry.count({where:{createdAt:{gte:previousStart,lt:currentStart},status:'WON'}}),
    ])
    const pct=(a:number,b:number)=>b===0?(a===0?0:100):Math.round(((a-b)/b)*100)

    // Stone distribution by category
    const categoryStats = await db.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { stones: true } } },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStones,
          totalCustomers,
          totalInquiries,
          newInquiries,
          pendingInquiries,
          wonInquiries,
          totalInventorySqm: totalInventoryValue._sum.totalSqm || 0,
          availableInventorySqm: totalInventoryValue._sum.availableSqm || 0,
          changes: { stones:pct(curStones,prevStones), customers:pct(curCustomers,prevCustomers), inquiries:pct(curInquiries,prevInquiries), won:pct(curWon,prevWon) },
        },
        recentInquiries,
        topStones,
        inquiriesByStatus,
        inquiriesByDay,
        categoryStats,
      },
    })
  } catch (e) {
    console.error('GET /api/dashboard error:', e)
    return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 })
  }
}
