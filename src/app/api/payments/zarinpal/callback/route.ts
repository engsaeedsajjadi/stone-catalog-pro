export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { issuePaymentReceipt } from '@/lib/payment-receipt'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'
import { verifyZarinpalPayment } from '@/lib/payments'

/**
 * GET /api/payments/zarinpal/callback — کال‌بک زرین‌پال
 */
export async function GET(req: NextRequest) {
  try {
    const limit = await rateLimit(`payment-callback:${getClientIp(req)}`, 30, 60)
    if (!limit.allowed) return NextResponse.json({ success: false, error: 'کمی بعد دوباره تلاش کنید.' }, { status: 429 })
    const u = new URL(req.url)
    const authority = u.searchParams.get('Authority')
    const status = u.searchParams.get('Status')

    if (!authority) {
      return NextResponse.json(
        { success: false, error: 'Authority یافت نشد' },
        { status: 400 }
      )
    }

    const payment = await db.payment.findFirst({
      where: { gateway: 'ZARINPAL', gatewayRefId: authority },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'پرداخت یافت نشد' },
        { status: 404 }
      )
    }

    // اگر پرداخت قبلاً تایید شده، ریدایرکت بدون تغییر
    if (payment.status === 'PAID') {
      return NextResponse.redirect(
        new URL(`/payment/success?receipt=${encodeURIComponent(issuePaymentReceipt(payment.id))}`, req.url)
      )
    }

    if (status !== 'OK') {
      // ثبت شکست پرداخت
      await db.payment.updateMany({
        where: { id: payment.id, status: { not: 'PAID' } },
        data: { status: 'FAILED', callbackData: u.toString() },
      })

      return NextResponse.json(
        { success: false, error: 'پرداخت لغو شد' },
        { status: 400 }
      )
    }

    const result = await verifyZarinpalPayment(
      payment.gatewayAmount ?? Math.round(payment.amount), // legacy requests sent the original rounded amount
      authority
    )

    // Persist both sides together; cancellation callbacks may never downgrade PAID.
    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', gatewayTrackId: String(result.ref_id || ''), paidAt: new Date(), callbackData: u.toString() },
      }),
      db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'PAID' } }),
    ])

    return NextResponse.redirect(
      new URL(`/payment/success?receipt=${encodeURIComponent(issuePaymentReceipt(payment.id))}`, req.url)
    )
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'تایید پرداخت ناموفق بود' },
      { status: 400 }
    )
  }
}
