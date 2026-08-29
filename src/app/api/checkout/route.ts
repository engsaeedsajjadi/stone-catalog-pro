export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'
import { requireAuth } from '@/lib/auth'

const CURRENCIES = ['IRR', 'IRT', 'USD', 'EUR', 'AED', 'RUB'] as const

const itemSchema = z.object({
  stoneId: z.string().min(1).max(64),
  quantity: z.number().positive().max(1_000_000),
  unit: z.enum(['SQM', 'SLAB']).default('SQM'),
  discount: z.number().min(0).max(100).default(0),
  notes: z.string().max(500).optional(),
})

const schema = z.object({
  customer: z.object({
    name: z.string().min(2).max(200),
    phone: z.string().min(5).max(30),
    email: z.string().email().optional().or(z.literal('')),
    country: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    address: z.string().max(500).optional(),
  }),

  items: z.array(itemSchema).min(1).max(50),

  currency: z.enum(CURRENCIES).default('IRR'),

  paymentMethod: z.string().max(50).optional(),
})

/**
 * تعیین نوع قیمت بر اساس واحد سفارش
 */
function priceTypeForUnit(unit: 'SQM' | 'SLAB') {
  return unit === 'SLAB' ? 'PER_SLAB' : 'PER_SQM'
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const limited = await rateLimit(`checkout:${ip}`, 10, 60)
    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
        { status: 429 }
      )
    }

    const viewer = await requireAuth(req)
    if ('response' in viewer) return viewer.response

    const body = schema.parse(await req.json())

    /* ------------------------------------------------------------------ */
    /* بررسی محصولات                                                       */
    /* ------------------------------------------------------------------ */

    const ids = [...new Set(body.items.map((item) => item.stoneId))]

    const stones = await db.stone.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })

    if (stones.length !== ids.length) {
      throw new Error('یکی از محصولات موجود نیست')
    }

    /* ------------------------------------------------------------------ */
    /* قیمت از سمت سرور — هرگز به عدد ارسالی کلاینت اعتماد نمی‌شود         */
    /* ------------------------------------------------------------------ */

    const priceRows = await db.stonePrice.findMany({
      where: {
        stoneId: { in: ids },
        currency: body.currency,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const pricedItems = body.items.map((item) => {
      const preferred = priceRows.find(
        (price) => price.stoneId === item.stoneId && price.type === priceTypeForUnit(item.unit)
      )
      const fallback = priceRows.find((price) => price.stoneId === item.stoneId)
      const price = preferred || fallback

      if (!price) {
        const stone = stones.find((s) => s.id === item.stoneId)
        throw new Error(
          `برای محصول «${stone?.name || item.stoneId}» قیمتی با ارز ${body.currency} تعریف نشده است`
        )
      }

      const gross = item.quantity * price.amount
      const total = gross * (1 - item.discount / 100)

      return {
        stoneId: item.stoneId,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: price.amount,
        discount: item.discount,
        notes: item.notes,
        total,
        currency: body.currency,
      }
    })

    const subtotal = pricedItems.reduce((sum, item) => sum + item.total, 0)

    /* ------------------------------------------------------------------ */
    /* پیدا کردن / ایجاد مشتری                                             */
    /* ------------------------------------------------------------------ */

    let customer = await db.customer.findFirst({
      where: { phone: body.customer.phone },
    })

    const customerData = {
      name: body.customer.name,
      email: body.customer.email || undefined,
      country: body.customer.country,
      city: body.customer.city,
      address: body.customer.address,
    }

    if (customer) {
      customer = await db.customer.update({
        where: { id: customer.id },
        data: customerData,
      })
    } else {
      customer = await db.customer.create({
        data: {
          ...customerData,
          phone: body.customer.phone,
        },
      })
    }

    /* ------------------------------------------------------------------ */
    /* ایجاد سفارش                                                         */
    /* ------------------------------------------------------------------ */

    const order = await db.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        customerId: customer.id,
        totalAmount: subtotal,
        currency: body.currency,
        paymentMethod: body.paymentMethod,
        items: { create: pricedItems },
      },
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'ورودی نامعتبر است', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Checkout error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ثبت سفارش ناموفق بود',
      },
      { status: 400 }
    )
  }
}
