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
    const customerType = searchParams.get('type')
    const q = searchParams.get('q')

    const where: Prisma.CustomerWhereInput = {}
    if (status) where.status = status
    if (customerType) where.customerType = customerType
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { inquiries: true, orders: true } },
      },
      take: 200,
    })
    return NextResponse.json({ success: true, data: customers })
  } catch (e) {
    console.error('GET /api/customers error:', e)
    return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response
  try {
    const body = await req.json()
    const { name, companyName, email, phone, country, city, address, customerType, status, source, notes, tags } = body

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'نام و شماره تماس الزامی است' }, { status: 400 })
    }

    // Check duplicate phone
    const existing = await db.customer.findFirst({ where: { phone } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'مشتری با این شماره تماس قبلاً ثبت شده است' }, { status: 400 })
    }

    const cust = await db.customer.create({
      data: {
        name,
        companyName: companyName || null,
        email: email || null,
        phone,
        country: country || null,
        city: city || null,
        address: address || null,
        customerType: customerType || 'RETAIL',
        status: status || 'NEW',
        source: source || 'DIRECT',
        notes: notes || null,
        tags: tags || null,
      },
    })
    return NextResponse.json({ success: true, data: cust })
  } catch (e) {
    console.error('POST /api/customers error:', e)
    return NextResponse.json({ success: false, error: 'ایجاد مشتری ناموفق بود' }, { status: 500 })
  }
}
