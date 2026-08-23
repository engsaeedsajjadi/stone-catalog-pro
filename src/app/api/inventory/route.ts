export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN','SALES_MANAGER','OPERATOR'])
  if ('response' in auth) return auth.response

  // محدودیت نرخ
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limited = await rateLimit(`inventory:${ip}`, 30, 60)
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
      { status: 429 }
    )
  }
  try {
    const body = await req.json()
    const { stoneId, slabCount, totalSqm, availableSqm, reservedSqm, inProductionSqm, blockCount, warehouseCode = 'MAIN', warehouseName = 'Main Warehouse', location } = body

    if (!stoneId) return NextResponse.json({ success: false, error: 'stoneId required' }, { status: 400 })

    const warehouse = await db.warehouse.upsert({ where: { code: warehouseCode }, update: { name: warehouseName }, create: { code: warehouseCode, name: warehouseName } })
    const inv = await db.inventory.upsert({
      where: { stoneId_warehouseId: { stoneId, warehouseId: warehouse.id } },
      create: {
        stoneId, warehouseId: warehouse.id,
        slabCount: slabCount || 0,
        totalSqm: totalSqm || 0,
        availableSqm: availableSqm ?? (totalSqm || 0),
        reservedSqm: reservedSqm || 0,
        inProductionSqm: inProductionSqm || 0,
        blockCount: blockCount || 0,
        location,
      },
      update: {
        slabCount, totalSqm, availableSqm, reservedSqm, inProductionSqm, blockCount, location,
        lastUpdated: new Date(),
      },
    })

    await db.stoneAuditLog.create({
      data: {
        stoneId,
        action: 'INVENTORY_UPDATE',
        newValue: `موجودی: ${slabCount} اسلب، ${availableSqm} متر مربع`,
      },
    })

    return NextResponse.json({ success: true, data: inv })
  } catch (e) {
    console.error('PUT /api/inventory error:', e)
    return NextResponse.json({ success: false, error: 'بروزرسانی ناموفق بود' }, { status: 500 })
  }
}
