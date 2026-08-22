export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { order: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: { _count: { select: { stones: true } } },
        },
        _count: { select: { stones: true } },
      },
    })
    return NextResponse.json({ success: true, data: categories })
  } catch (e) {
    console.error('GET /api/categories error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response
  try {
    const body = await req.json()
    const { name, nameEn, slug, parentId, mediaAssetId, description, descriptionEn, isActive } = body

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'نام و slug الزامی است' }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await db.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'این slug قبلاً استفاده شده است' }, { status: 400 })
    }

    // Determine order
    const siblingCount = await db.category.count({ where: { parentId: parentId || null } })

    const media = mediaAssetId ? await db.mediaAsset.findUnique({ where: { id: mediaAssetId }, select: { id: true, url: true } }) : null
    const cat = await db.category.create({
      data: {
        name,
        nameEn,
        slug,
        parentId: parentId || null,
        image: media?.url || null,
        imageMediaAssetId: media?.id || null,
        description,
        descriptionEn,
        isActive: isActive !== false,
        order: siblingCount + 1,
      },
    })
    return NextResponse.json({ success: true, data: cat })
  } catch (e) {
    console.error('POST /api/categories error:', e)
    return NextResponse.json({ success: false, error: 'Create failed' }, { status: 500 })
  }
}
