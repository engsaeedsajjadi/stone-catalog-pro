export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        inquiries: { take: 20, orderBy: { createdAt: 'desc' }, include: { stone: { select: { name: true, code: true } } } },
        orders: true,
        interactions: { orderBy: { createdAt: 'desc' } },
        _count: { select: { inquiries: true, orders: true } },
      },
    })
    if (!customer) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: customer })
  } catch (e) {
    console.error('GET /api/customers/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    const body = await req.json()
    const { name, companyName, email, phone, country, city, address, customerType, status, source, assigneeId, notes, tags } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (companyName !== undefined) updateData.companyName = companyName || null
    if (email !== undefined) updateData.email = email || null
    if (phone !== undefined) updateData.phone = phone
    if (country !== undefined) updateData.country = country || null
    if (city !== undefined) updateData.city = city || null
    if (address !== undefined) updateData.address = address || null
    if (customerType !== undefined) updateData.customerType = customerType
    if (status !== undefined) updateData.status = status
    if (source !== undefined) updateData.source = source || null
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null
    if (notes !== undefined) updateData.notes = notes || null
    if (tags !== undefined) updateData.tags = tags || null

    const customer = await db.customer.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, data: customer })
  } catch (e) {
    console.error('PUT /api/customers/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(_req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    // Check for related inquiries/orders
    const inquiryCount = await db.inquiry.count({ where: { customerId: id } })
    const orderCount = await db.order.count({ where: { customerId: id } })
    if (inquiryCount > 0 || orderCount > 0) {
      return NextResponse.json({
        success: false,
        error: `این مشتری ${inquiryCount} استعلام و ${orderCount} سفارش دارد. ابتدا آن‌ها را حذف یا منتقل کنید.`,
      }, { status: 400 })
    }
    await db.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/customers/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
