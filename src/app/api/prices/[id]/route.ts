export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(_req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    const price = await db.stonePrice.findUnique({ where: { id }, select: { stoneId: true, type: true, amount: true, currency: true } })
    if (!price) {
      return NextResponse.json({ success: false, error: 'قیمت یافت نشد' }, { status: 404 })
    }

    await db.stonePrice.delete({ where: { id } })

    await db.stoneAuditLog.create({
      data: {
        stoneId: price.stoneId,
        action: 'PRICE_DELETE',
        newValue: `حذف قیمت ${price.type} (${price.currency}) = ${price.amount}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/prices/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
