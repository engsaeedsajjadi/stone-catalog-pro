export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'
import { z } from 'zod'

/**
 * اعتبارسنجی ورودی موجودی
 *
 * بدون این لایه، ارسال مقدار غیرعددی باعث خطای پایگاه‌داده و پاسخ ۵۰۰ می‌شد
 * و مقدارِ منفی هم بدون بررسی ذخیره می‌شد.
 */
const inventorySchema = z.object({
  stoneId: z.string().min(1).max(64),

  slabCount: z.coerce.number().int().min(0).max(1_000_000).default(0),
  blockCount: z.coerce.number().int().min(0).max(1_000_000).default(0),

  totalSqm: z.coerce.number().min(0).max(100_000_000).default(0),
  availableSqm: z.coerce.number().min(0).max(100_000_000).optional(),
  reservedSqm: z.coerce.number().min(0).max(100_000_000).default(0),
  inProductionSqm: z.coerce.number().min(0).max(100_000_000).default(0),

  warehouseCode: z.string().trim().min(1).max(32).default('MAIN'),
  warehouseName: z.string().trim().max(100).default('انبار مرکزی'),
  location: z.string().trim().max(200).optional(),
})

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN','SALES_MANAGER','OPERATOR'])
  if ('response' in auth) return auth.response

  // محدودیت نرخ
  const ip = getClientIp(req)
  const limited = await rateLimit(`inventory:${ip}`, 30, 60)
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
      { status: 429 }
    )
  }
  try {
    const parsed = inventorySchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'ورودی نامعتبر است', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const {
      stoneId,
      slabCount,
      totalSqm,
      availableSqm,
      reservedSqm,
      inProductionSqm,
      blockCount,
      warehouseCode,
      warehouseName,
      location,
    } = parsed.data

    const warehouse = await db.warehouse.upsert({ where: { code: warehouseCode }, update: { name: warehouseName }, create: { code: warehouseCode, name: warehouseName } })
    const inv = await db.inventory.upsert({
      where: { stoneId_warehouseId: { stoneId, warehouseId: warehouse.id } },
      create: {
        stoneId, warehouseId: warehouse.id,
        slabCount,
        totalSqm,
        availableSqm: availableSqm ?? totalSqm,
        reservedSqm,
        inProductionSqm,
        blockCount,
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
        newValue: `موجودی: ${slabCount} اسلب، ${availableSqm ?? totalSqm} متر مربع`,
      },
    })

    return NextResponse.json({ success: true, data: inv })
  } catch (e) {
    console.error('PUT /api/inventory error:', e)
    return NextResponse.json({ success: false, error: 'بروزرسانی ناموفق بود' }, { status: 500 })
  }
}
