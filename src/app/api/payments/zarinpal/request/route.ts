export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createZarinpalPayment } from '@/lib/payments'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const requestSchema = z.object({
  orderId: z.string().min(1),
})

/**
 * POST /api/payments/zarinpal/request — ایجاد پرداخت زرین‌پال
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('response' in auth) return auth.response

  try {
    const { orderId } = requestSchema.parse(await req.json())

    const order = await db.order.findUnique({ where: { id: orderId } })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'این سفارش قبلاً پرداخت شده است' },
        { status: 400 }
      )
    }

    const callback = process.env.PAYMENT_CALLBACK_URL

    if (!callback) {
      throw new Error('PAYMENT_CALLBACK_URL تنظیم نشده است')
    }

    const result = await createZarinpalPayment(
      order.id,
      Math.round(order.totalAmount),
      callback,
      `Order ${order.orderNumber}`
    )

    await db.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        gateway: 'ZARINPAL',
        gatewayRefId: result.authority,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'درگاه پرداخت در دسترس نیست' },
      { status: 503 }
    )
  }
}
