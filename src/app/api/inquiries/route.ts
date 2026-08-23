export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
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
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER', 'OPERATOR'])
  if ('response' in auth) return auth.response
  try {
    const body = await req.json()
    const { customerName, customerPhone, customerEmail, stoneId, inquiryType, message, requiredSqm, customerCountry, customerCity } = body

    if (!customerName || !customerPhone) {
      return NextResponse.json({ success: false, error: 'نام و شماره تماس الزامی است' }, { status: 400 })
    }

    // یافتن مشتری موجود بر اساس شماره تماس
    let customer = await db.customer.findFirst({ where: { phone: customerPhone } })
    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
          country: customerCountry || null,
          city: customerCity || null,
          customerType: 'RETAIL',
          status: 'NEW',
          source: 'WEBSITE',
        },
      })
    }

    const inquiry = await db.inquiry.create({
      data: {
        customerId: customer.id,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        customerCountry,
        customerCity,
        stoneId: stoneId || null,
        inquiryType: inquiryType || 'PRICE_INQUIRY',
        message,
        requiredSqm: requiredSqm ? parseFloat(requiredSqm) : null,
        status: 'NEW',
        priority: 'MEDIUM',
      },
      include: { stone: true, customer: true },
    })

    return NextResponse.json({ success: true, data: inquiry })
  } catch (e) {
    console.error('POST /api/inquiries error:', e)
    return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 })
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
