export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { slugify } from '@/lib/slug'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const stone = await db.stone.findUnique({
      where: { id },
      include: {
        category: { include: { parent: true } },
        images: { orderBy: { order: 'asc' } },
        videos: true,
        prices: { where: { isActive: true }, orderBy: { amount: 'asc' } },
        inventory: true,
        auditLogs: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!stone) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    // Increment view count
    await db.stone.update({ where: { id }, data: { viewCount: { increment: 1 } } })

    // Get related stones (same category)
    const related = await db.stone.findMany({
      where: { categoryId: stone.categoryId, id: { not: id } },
      take: 6,
      include: { images: { take: 1 } },
    })

    return NextResponse.json({ success: true, data: { ...stone, inventory: stone.inventory?.[0] || null, related } })
  } catch (e) {
    console.error('GET /api/products/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['ADMIN','SALES_MANAGER','OPERATOR'])
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    const body = await req.json()
    const { prices, inventory, imageAssets, images, categorySlug, ...restBody } = body

    // Filter to only valid Stone fields
    const stoneFields = [
      'name', 'nameEn', 'categoryId', 'quarry', 'quarryEn', 'country',
      'color', 'colorSecondary', 'pattern', 'processingType', 'surfaceFinish',
      'thickness', 'width', 'length', 'weight', 'waterAbsorption',
      'compressiveStrength', 'abrasionResistance', 'density',
      'application', 'suitableFor', 'exportCountries', 'features',
      'description', 'descriptionEn', 'tags', 'slug',
      'isFeatured', 'isNewest', 'isBestSeller', 'isExportGrade',
      'status', 'rating',
    ]

    // Resolve categorySlug to categoryId if provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (categorySlug) {
      const cat = await db.category.findUnique({ where: { slug: categorySlug } })
      if (cat) updateData.categoryId = cat.id
    }
    for (const f of stoneFields) {
      if (restBody[f] !== undefined) updateData[f] = restBody[f]
    }
    if (restBody.slug === undefined && (restBody.name !== undefined || restBody.code !== undefined)) { const current = await db.stone.findUnique({where:{id},select:{name:true,code:true}}); if (current) updateData.slug = slugify(`${restBody.name ?? current.name}-${restBody.code ?? current.code}`) }

    const stone = await db.$transaction(async (tx) => {
      await tx.stone.update({ where: { id }, data: updateData })

      if (Array.isArray(prices)) {
        const allowed = ['PER_SQM','PER_SLAB','DOMESTIC','WHOLESALE','PARTNER','PROJECT','EXPORT']
        for (const p of prices) {
          if (!p || !allowed.includes(String(p.type)) || !p.currency) continue
          const amount = Number(p.amount)
          if (!Number.isFinite(amount) || amount <= 0) {
            if (p.id) await tx.stonePrice.deleteMany({ where: { id: p.id, stoneId: id } })
            continue
          }
          if (p.id) {
            await tx.stonePrice.updateMany({ where: { id: p.id, stoneId: id }, data: { amount, currency: p.currency, minQuantity: p.minQuantity == null || p.minQuantity === '' ? null : Number(p.minQuantity), discount: p.discount == null || p.discount === '' ? 0 : Number(p.discount), notes: p.notes ?? null, isActive: true, updatedAt: new Date() } })
          } else {
            const existingPrice = await tx.stonePrice.findFirst({ where: { stoneId: id, type: String(p.type), currency: String(p.currency) } })
            if (existingPrice) {
              await tx.stonePrice.update({ where: { id: existingPrice.id }, data: { amount, minQuantity: p.minQuantity == null || p.minQuantity === '' ? null : Number(p.minQuantity), discount: p.discount == null || p.discount === '' ? 0 : Number(p.discount), notes: p.notes ?? null, isActive: true } })
            } else {
              await tx.stonePrice.create({ data: { stoneId: id, type: String(p.type), currency: String(p.currency), amount, minQuantity: p.minQuantity == null || p.minQuantity === '' ? null : Number(p.minQuantity), discount: p.discount == null || p.discount === '' ? 0 : Number(p.discount), notes: p.notes ?? null } })
            }
          }
        }
      }

      if (inventory) {
        const warehouseCode = inventory.warehouseCode || 'MAIN'
        const warehouse = await tx.warehouse.upsert({ where: { code: warehouseCode }, update: {}, create: { code: warehouseCode, name: inventory.warehouseName || 'Main Warehouse' } })
        await tx.inventory.upsert({
          where: { stoneId_warehouseId: { stoneId: id, warehouseId: warehouse.id } },
          update: { slabCount: Number(inventory.slabCount) || 0, totalSqm: Number(inventory.totalSqm) || 0, availableSqm: Number(inventory.availableSqm) || 0, reservedSqm: Number(inventory.reservedSqm) || 0, inProductionSqm: Number(inventory.inProductionSqm) || 0, blockCount: Number(inventory.blockCount) || 0, location: inventory.location || null, lastUpdated: new Date() },
          create: { stoneId: id, warehouseId: warehouse.id, slabCount: Number(inventory.slabCount) || 0, totalSqm: Number(inventory.totalSqm) || 0, availableSqm: Number(inventory.availableSqm) || 0, reservedSqm: Number(inventory.reservedSqm) || 0, inProductionSqm: Number(inventory.inProductionSqm) || 0, blockCount: Number(inventory.blockCount) || 0, location: inventory.location || null },
        })
      }

      if (Array.isArray(imageAssets) || Array.isArray(images)) {
        const requested = Array.isArray(imageAssets) ? imageAssets : images
        const keepStoneImageIds = new Set<string>()
        const keepMediaIds = new Set<string>()
        for (const img of requested || []) {
          if (img?.stoneImageId) keepStoneImageIds.add(String(img.stoneImageId))
          if (img?.mediaAssetId) keepMediaIds.add(String(img.mediaAssetId))
        }
        const currentImages = await tx.stoneImage.findMany({ where: { stoneId: id } })
        for (const current of currentImages) {
          if (!keepStoneImageIds.has(current.id) && !(current.mediaAssetId && keepMediaIds.has(current.mediaAssetId))) {
            await tx.stoneImage.delete({ where: { id: current.id } })
          }
        }
        let order = 0
        for (const img of requested || []) {
          if (!img) continue
          const mediaAssetId = img.mediaAssetId || null
          const url = img.url || ''
          const existing = img.stoneImageId ? await tx.stoneImage.findUnique({ where: { id: img.stoneImageId } }) : mediaAssetId ? await tx.stoneImage.findFirst({ where: { stoneId: id, mediaAssetId } }) : null
          if (existing) {
            await tx.stoneImage.update({ where: { id: existing.id }, data: { url: url || existing.url, thumbnail: img.thumbnail || url || existing.thumbnail, alt: img.alt || existing.alt, type: img.type || existing.type, isPrimary: img.isPrimary ?? order === 0, order: Number.isFinite(Number(img.order)) ? Number(img.order) : order, mediaAssetId } })
          } else if (url || mediaAssetId) {
            await tx.stoneImage.create({ data: { stoneId: id, url, thumbnail: img.thumbnail || url || null, alt: img.alt || null, type: img.type || 'GALLERY', isPrimary: img.isPrimary ?? order === 0, order: Number.isFinite(Number(img.order)) ? Number(img.order) : order, mediaAssetId } })
          }
          order++
        }
      }

      return tx.stone.findUnique({ where: { id }, include: { prices: true, images: { orderBy: { order: 'asc' } }, inventory: true, category: true } })
    })

    // Audit log
    await db.stoneAuditLog.create({
      data: {
        stoneId: id,
        action: 'INFO_UPDATE',
        newValue: `اطلاعات محصول بروزرسانی شد`,
      },
    })

    return NextResponse.json({ success: true, data: stone })
  } catch (e) {
    console.error('PUT /api/products/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(_req, ['ADMIN'])
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    await db.stone.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/products/[id] error:', e)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
