export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Get all prices for a stone (or all)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stoneId = searchParams.get('stoneId')

    const where = stoneId ? { stoneId } : {}
    const prices = await db.stonePrice.findMany({
      where,
      take: 500,
      include: { stone: { select: { id: true, name: true, code: true } } },
      orderBy: [{ stoneId: 'asc' }, { type: 'asc' }],
    })
    return NextResponse.json({ success: true, data: prices })
  } catch (e) {
    console.error('GET /api/prices error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

// Bulk update prices (also supports creating new prices via `create` field)
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response
  try {
    const body = await req.json()
    const { updates, creates } = body as {
      updates: { id: string; amount: number; discount?: number; validUntil?: string; minQuantity?: number; notes?: string }[]
      creates: { stoneId: string; type: string; amount: number; currency: string; minQuantity?: number; discount?: number; notes?: string }[]
    }

    const results = { updated: 0, created: 0, errors: [] as string[] }

    // Updates
    for (const u of updates || []) {
      try {
        const updated = await db.stonePrice.update({
          where: { id: u.id },
          data: {
            amount: u.amount,
            discount: u.discount ?? 0,
            minQuantity: u.minQuantity,
            notes: u.notes,
            validUntil: u.validUntil ? new Date(u.validUntil) : null,
          },
        })
        // Log audit
        await db.stoneAuditLog.create({
          data: {
            stoneId: updated.stoneId,
            action: 'PRICE_UPDATE',
            newValue: `${updated.type} (${updated.currency}) = ${u.amount}`,
          },
        })
        results.updated++
      } catch (e) {
        results.errors.push(`Update ${u.id}: ${(e as Error).message}`)
      }
    }

    // Creates
    for (const c of creates || []) {
      try {
        // Check if same type+currency already exists for this stone
        const existing = await db.stonePrice.findFirst({
          where: { stoneId: c.stoneId, type: c.type, currency: c.currency },
        })
        if (existing) {
          // Update instead of create
          await db.stonePrice.update({
            where: { id: existing.id },
            data: {
              amount: c.amount,
              minQuantity: c.minQuantity,
              discount: c.discount ?? 0,
              notes: c.notes,
              isActive: true,
            },
          })
          results.updated++
        } else {
          await db.stonePrice.create({
            data: {
              stoneId: c.stoneId,
              type: c.type,
              amount: c.amount,
              currency: c.currency,
              minQuantity: c.minQuantity,
              discount: c.discount ?? 0,
              notes: c.notes,
              isActive: true,
            },
          })
          results.created++
        }
      } catch (e) {
        results.errors.push(`Create ${c.stoneId}/${c.type}/${c.currency}: ${(e as Error).message}`)
      }
    }

    return NextResponse.json({ success: true, data: results })
  } catch (e) {
    console.error('PUT /api/prices error:', e)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

// Create single price
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response
  try {
    const body = await req.json()
    // Check if exists, then update or create
    const existing = await db.stonePrice.findFirst({
      where: { stoneId: body.stoneId, type: body.type, currency: body.currency },
    })
    if (existing) {
      const updated = await db.stonePrice.update({
        where: { id: existing.id },
        data: { amount: body.amount, minQuantity: body.minQuantity, discount: body.discount || 0, notes: body.notes, isActive: true },
      })
      return NextResponse.json({ success: true, data: updated })
    }
    const price = await db.stonePrice.create({ data: body })
    return NextResponse.json({ success: true, data: price })
  } catch (e) {
    console.error('POST /api/prices error:', e)
    return NextResponse.json({ success: false, error: 'Create failed' }, { status: 500 })
  }
}
