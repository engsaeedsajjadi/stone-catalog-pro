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
    const cat = await db.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { include: { _count: { select: { stones: true } } } },
        _count: { select: { stones: true } },
      },
    })
    if (!cat) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: cat })
  } catch (e) {
    console.error('GET /api/categories/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    const body = await req.json()
    const { name, nameEn, slug, mediaAssetId, description, descriptionEn, isActive, order, parentId } = body

    // If slug changed, check uniqueness
    if (slug) {
      const existing = await db.category.findFirst({
        where: { slug, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ success: false, error: 'این slug قبلاً استفاده شده است' }, { status: 400 })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (slug !== undefined) updateData.slug = slug
    if (mediaAssetId !== undefined) {
      const media = mediaAssetId ? await db.mediaAsset.findUnique({ where: { id: mediaAssetId }, select: { id: true, url: true } }) : null
      updateData.image = media?.url || null
      updateData.imageMediaAssetId = media?.id || null
    }
    if (description !== undefined) updateData.description = description
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order
    if (parentId !== undefined) updateData.parentId = parentId || null

    const cat = await db.category.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json({ success: true, data: cat })
  } catch (e) {
    console.error('PUT /api/categories/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response
  try {
    const { id } = await params

    // Check if category has stones
    const stoneCount = await db.stone.count({ where: { categoryId: id } })
    if (stoneCount > 0) {
      return NextResponse.json({
        success: false,
        error: `این دسته‌بندی شامل ${stoneCount} محصول است. ابتدا محصولات را منتقل یا حذف کنید.`,
      }, { status: 400 })
    }

    // Check if has children
    const childCount = await db.category.count({ where: { parentId: id } })
    if (childCount > 0) {
      return NextResponse.json({
        success: false,
        error: `این دسته‌بندی شامل ${childCount} زیردسته است. ابتدا زیردسته‌ها را حذف کنید.`,
      }, { status: 400 })
    }

    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/categories/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
