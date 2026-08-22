export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth'
import { slugify } from '@/lib/slug'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const categorySlug = searchParams.get('category')
    const color = searchParams.get('color')
    const finish = searchParams.get('finish')
    const thickness = searchParams.get('thickness')
    const isExport = searchParams.get('export') === 'true'
    const isFeatured = searchParams.get('featured') === 'true'
    const isNewest = searchParams.get('newest') === 'true'
    const isBestSeller = searchParams.get('bestseller') === 'true'
    const inStock = searchParams.get('instock') === 'true'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '24')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { nameEn: { contains: q } },
        { code: { contains: q } },
        { quarry: { contains: q } },
        { color: { contains: q } },
      ]
    }
    if (categorySlug) {
      const cat = await db.category.findUnique({ where: { slug: categorySlug }, select: { id: true } })
      if (cat) {
        const children = await db.category.findMany({ where: { parentId: cat.id }, select: { id: true } })
        const catIds = [cat.id, ...children.map(c => c.id)]
        where.categoryId = { in: catIds }
      }
    }
    if (color) where.color = { contains: color }
    if (finish) where.surfaceFinish = finish
    if (thickness) where.thickness = thickness
    if (isExport) where.isExportGrade = true
    if (isFeatured) where.isFeatured = true
    if (isNewest) where.isNewest = true
    if (isBestSeller) where.isBestSeller = true
    if (inStock) where.inventory = { some: { availableSqm: { gt: 0 } } }

    // Price range filter
    if (minPrice || maxPrice) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const priceFilter: any = { isActive: true, currency: 'IRR', type: 'PER_SQM' }
      if (minPrice) priceFilter.amount = { ...(priceFilter.amount || {}), gte: parseFloat(minPrice) }
      if (maxPrice) priceFilter.amount = { ...(priceFilter.amount || {}), lte: parseFloat(maxPrice) }
      where.prices = { some: priceFilter }
    }

    // For price-based sorting, we need to fetch all matching and sort in JS
    // because Prisma's _min/_max orderBy on relations doesn't work well with SQLite
    // and pagination combined.
    const needsPriceSort = sort === 'price-asc' || sort === 'price-desc'

    if (needsPriceSort) {
      // Fetch all matching stones with their prices
      const allStones = await db.stone.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: { take: 1, orderBy: { order: 'asc' } },
          prices: { where: { isActive: true } },
          inventory: true,
        },
      })

      // Sort by PER_SQM price in IRR
      const sorted = allStones.sort((a, b) => {
        const priceA = a.prices.find(p => p.type === 'PER_SQM' && p.currency === 'IRR')?.amount ?? Infinity
        const priceB = b.prices.find(p => p.type === 'PER_SQM' && p.currency === 'IRR')?.amount ?? Infinity
        return sort === 'price-asc' ? priceA - priceB : priceB - priceA
      })

      const total = sorted.length
      const pagedStones = sorted.slice((page - 1) * pageSize, page * pageSize)

      return NextResponse.json({
        success: true,
        data: pagedStones.map((stone: any) => ({ ...stone, inventory: stone.inventory?.[0] || null })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      })
    }

    // Standard sort
    let orderBy: Prisma.StoneOrderByWithRelationInput = { createdAt: 'desc' }
    if (sort === 'popular') orderBy = { viewCount: 'desc' }
    if (sort === 'rating') orderBy = { rating: 'desc' }

    const [total, stones] = await Promise.all([
      db.stone.count({ where }),
      db.stone.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          images: { take: 1, orderBy: { order: 'asc' } },
          prices: { where: { isActive: true } },
          inventory: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: stones,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (e) {
    console.error('GET /api/products error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER', 'OPERATOR'])
  if ('response' in auth) return auth.response
  try {
    const body = await req.json()
    const { prices, images, imageAssets, inventory, categorySlug, ...rest } = body

    if (!rest.name || !rest.code) {
      return NextResponse.json({ success: false, error: 'نام و کد محصول الزامی است' }, { status: 400 })
    }

    // Check code uniqueness
    const existing = await db.stone.findUnique({ where: { code: rest.code } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'این کد محصول قبلاً استفاده شده است' }, { status: 400 })
    }

    // Resolve category
    let categoryId = rest.categoryId
    if (!categoryId && categorySlug) {
      const cat = await db.category.findUnique({ where: { slug: categorySlug } })
      if (cat) categoryId = cat.id
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'دسته‌بندی محصول الزامی است' }, { status: 400 })
    }

    // Filter out unknown fields to prevent Prisma errors
    const stoneFields = [
      'name', 'nameEn', 'code', 'categoryId', 'quarry', 'quarryEn', 'country',
      'color', 'colorSecondary', 'pattern', 'processingType', 'surfaceFinish',
      'thickness', 'width', 'length', 'weight', 'waterAbsorption',
      'compressiveStrength', 'abrasionResistance', 'density',
      'application', 'suitableFor', 'exportCountries', 'features',
      'description', 'descriptionEn', 'tags', 'slug',
      'isFeatured', 'isNewest', 'isBestSeller', 'isExportGrade',
      'status', 'rating',
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stoneData: any = { categoryId }
    for (const f of stoneFields) {
      if (body[f] !== undefined) stoneData[f] = body[f]
    }
    // Booleans default to false if not provided
    if (stoneData.isFeatured === undefined) stoneData.isFeatured = false
    if (stoneData.isNewest === undefined) stoneData.isNewest = false
    if (stoneData.isBestSeller === undefined) stoneData.isBestSeller = false
    if (stoneData.isExportGrade === undefined) stoneData.isExportGrade = false
    if (stoneData.status === undefined) stoneData.status = 'AVAILABLE'
    if (stoneData.slug === undefined || !stoneData.slug) stoneData.slug = slugify(`${stoneData.name}-${stoneData.code}`)

    if (images?.length) return NextResponse.json({ success: false, error: 'تصاویر باید از طریق آپلودر فایل ثبت شوند' }, { status: 400 })
    const validMediaIds = (imageAssets || []).map((x: any) => x.mediaAssetId).filter(Boolean)
    if (validMediaIds.length) {
      const count = await db.mediaAsset.count({ where: { id: { in: validMediaIds } } })
      if (count !== validMediaIds.length) return NextResponse.json({ success: false, error: 'یکی از فایل‌های تصویر معتبر نیست' }, { status: 400 })
    }

    const stone = await db.stone.create({
      data: {
        ...stoneData,
        prices: prices?.length ? { create: prices.filter((p: any) => p.amount > 0) } : undefined,
        images: validMediaIds.length ? { create: imageAssets.map((x: any) => ({ mediaAssetId: x.mediaAssetId, url: '', alt: x.alt || rest.name, type: x.type || 'GALLERY', isPrimary: !!x.isPrimary, order: x.order || 0 })) } : undefined,
      },
      include: { prices: true, images: true, inventory: true, category: true },
    })

    if (validMediaIds.length) {
      const media = await db.mediaAsset.findMany({ where: { id: { in: validMediaIds } }, select: { id: true, url: true } })
      for (const item of media) await db.stoneImage.updateMany({ where: { stoneId: stone.id, mediaAssetId: item.id }, data: { url: item.url, thumbnail: item.url } })
    }
    if (inventory) {
      const warehouse = await db.warehouse.upsert({ where: { code: inventory.warehouseCode || 'MAIN' }, update: {}, create: { code: inventory.warehouseCode || 'MAIN', name: inventory.warehouseName || 'Main Warehouse' } })
      await db.inventory.upsert({
        where: { stoneId_warehouseId: { stoneId: stone.id, warehouseId: warehouse.id } },
        update: { slabCount: inventory.slabCount || 0, totalSqm: inventory.totalSqm || 0, availableSqm: inventory.availableSqm || 0, reservedSqm: inventory.reservedSqm || 0, inProductionSqm: inventory.inProductionSqm || 0, blockCount: inventory.blockCount || 0 },
        create: { stoneId: stone.id, warehouseId: warehouse.id, slabCount: inventory.slabCount || 0, totalSqm: inventory.totalSqm || 0, availableSqm: inventory.availableSqm || 0, reservedSqm: inventory.reservedSqm || 0, inProductionSqm: inventory.inProductionSqm || 0, blockCount: inventory.blockCount || 0 },
      })
    }

    // Audit log
    await db.stoneAuditLog.create({
      data: {
        stoneId: stone.id,
        action: 'CREATE',
        userId: auth.user.id,
        newValue: `محصول جدید با کد ${stone.code} ایجاد شد`,
      },
    })

    return NextResponse.json({ success: true, data: stone })
  } catch (e) {
    console.error('POST /api/products error:', e)
    return NextResponse.json({ success: false, error: 'Create failed' }, { status: 500 })
  }
}
