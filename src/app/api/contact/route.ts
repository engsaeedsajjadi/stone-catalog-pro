export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const contactSchema = z.object({
  customerName: z.string().min(2).max(200),
  customerPhone: z.string().min(5).max(30),
  customerEmail: z.string().email().optional().or(z.literal('')),
  message: z.string().min(5).max(5000),
})

/**
 * POST /api/contact — فرم تماس عمومی
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limited = await rateLimit(`contact:${ip}`, 10, 60)
    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
        { status: 429 }
      )
    }

    const body = contactSchema.parse(await req.json())

    const inquiry = await db.inquiry.create({
      data: {
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail || null,
        inquiryType: 'CONTACT',
        message: body.message,
        status: 'NEW',
        priority: 'MEDIUM',
      },
    })

    return NextResponse.json(
      { success: true, data: { id: inquiry.id } },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'ورودی نامعتبر', details: e.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'ثبت پیام ناموفق بود' },
      { status: 500 }
    )
  }
}
