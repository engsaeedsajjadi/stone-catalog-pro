export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

/**
 * فرم استعلام عمومی
 *
 * این مسیر از سوی بازدیدکنندگان ناشناس استفاده می‌شود، بنابراین:
 * - ورودی با zod به‌دقت اعتبارسنجی می‌شود
 * - محدودیت نرخ دارد
 * - یک فیلد «تله» (honeypot) دارد که ربات‌ها آن را پر می‌کنند
 */
const publicInquirySchema = z.object({
  customerName: z.string().trim().min(2).max(200),
  customerPhone: z.string().trim().min(5).max(30),
  customerEmail: z.string().trim().email().max(200).optional().or(z.literal('')),
  customerCountry: z.string().trim().max(100).optional(),
  customerCity: z.string().trim().max(100).optional(),
  stoneId: z.string().trim().max(64).optional(),
  inquiryType: z.string().trim().max(50).optional(),
  message: z.string().trim().max(5000).optional(),
  requiredSqm: z.coerce.number().positive().max(1_000_000).optional(),
  /** فیلد تله — باید خالی بماند */
  website: z.string().max(0).optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER', 'OPERATOR'])
  if ('response' in auth) return auth.response

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    const where: Prisma.InquiryWhereInput = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    const inquiries = await db.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        stone: { select: { id: true, name: true, code: true, images: { take: 1 } } },
        customer: { select: { id: true, name: true, country: true, city: true, customerType: true } },
      },
      take: 100,
    })

    return NextResponse.json({ success: true, data: inquiries })
  } catch (e) {
    console.error('GET /api/inquiries error:', e)
    return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limited = await rateLimit(`inquiry:${ip}`, 5, 600)

  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
      { status: 429 }
    )
  }

  try {
    const parsed = publicInquirySchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'ورودی نامعتبر است', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const body = parsed.data

    // تله‌ی ربات: پاسخ موفق برمی‌گردانیم ولی چیزی ثبت نمی‌کنیم
    if (body.website) {
      return NextResponse.json({ success: true, data: { id: null } }, { status: 201 })
    }

    // بررسی وجود محصول (اگر ارسال شده باشد)
    if (body.stoneId) {
      const stone = await db.stone.findUnique({
        where: { id: body.stoneId },
        select: { id: true },
      })
      if (!stone) {
        return NextResponse.json(
          { success: false, error: 'محصول مورد نظر یافت نشد' },
          { status: 400 }
        )
      }
    }

    let customer = await db.customer.findFirst({
      where: { phone: body.customerPhone },
      select: { id: true },
    })

    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: body.customerName,
          phone: body.customerPhone,
          email: body.customerEmail || null,
          country: body.customerCountry || null,
          city: body.customerCity || null,
          customerType: 'RETAIL',
          status: 'NEW',
          source: 'WEBSITE',
        },
        select: { id: true },
      })
    }

    const inquiry = await db.inquiry.create({
      data: {
        customerId: customer.id,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail || '',
        customerCountry: body.customerCountry,
        customerCity: body.customerCity,
        stoneId: body.stoneId || null,
        inquiryType: body.inquiryType || 'PRICE_INQUIRY',
        message: body.message,
        requiredSqm: body.requiredSqm ?? null,
        status: 'NEW',
        priority: 'MEDIUM',
      },
      include: { stone: true, customer: true },
    })

    return NextResponse.json({ success: true, data: inquiry }, { status: 201 })
  } catch (error) {
    console.error('POST /api/inquiries error:', error)
    return NextResponse.json(
      { success: false, error: 'ثبت استعلام ناموفق بود' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response

  try {
    const body = await req.json() as { id?: string; status?: string; priority?: string; assigneeId?: string | null; notes?: string | null }
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'شناسه استعلام الزامی است' }, { status: 400 })
    }

    const allowedStatuses = new Set(['NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST'])
    const allowedPriorities = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    if (body.status && !allowedStatuses.has(body.status)) {
      return NextResponse.json({ success: false, error: 'وضعیت نامعتبر است' }, { status: 400 })
    }
    if (body.priority && !allowedPriorities.has(body.priority)) {
      return NextResponse.json({ success: false, error: 'اولویت نامعتبر است' }, { status: 400 })
    }

    const inquiry = await db.inquiry.update({
      where: { id: body.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.priority ? { priority: body.priority } : {}),
        ...(body.assigneeId !== undefined ? { assigneeId: body.assigneeId } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
      include: {
        stone: { select: { id: true, name: true, code: true } },
        customer: true,
      },
    })

    return NextResponse.json({ success: true, data: inquiry })
  } catch (e) {
    console.error('PATCH /api/inquiries error:', e)
    return NextResponse.json({ success: false, error: 'بروزرسانی ناموفق بود' }, { status: 500 })
  }
}
