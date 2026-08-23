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

    // TODO: پس از prisma generate، از Prisma.StoneWhereInput استفاده شود
    const where: Prisma.StoneWhereInput = {}
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
      const cat = await db.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true, children: { select: { id: true } } },
      })
      if (cat) {
        const catIds = [cat.id, ...cat.children.map(c => c.id)]
        where.categoryId = { in: catIds }
      }
    }
    if (color) where.color = { contains: color, mode: 'insensitive' }
    if (finish) where.surfaceFinish = finish
    if (thickness) where.thickness = thickness
    if (isExport) where.isExportGrade = true
    if (isFeatured) where.isFeatured = true
    if (isNewest) where.isNewest = true
    if (isBestSeller) where.isBestSeller = true
    if (inStock) where.inventory = { some: { availableSqm: { gt: 0 } } }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceFilter: Prisma.StonePriceWhereInput = { isActive: true, currency: 'IRR', type: 'PER_SQM' }
      if (minPrice || maxPrice) {
        const amountFilter: { gte?: number; lte?: number } = {}
        if (minPrice) amountFilter.gte = parseFloat(minPrice)
        if (maxPrice) amountFilter.lte = parseFloat(maxPrice)
        priceFilter.amount = amountFilter as Prisma.FloatFilter
      }
      where.prices = { some: priceFilter }
    }

    // مرتب‌سازی بر اساس قیمت با کوئری ایمن و صفحه‌بندی
    const needsPriceSort = sort === 'price-asc' || sort === 'price-desc'

    if (needsPriceSort) {
      const priceOrder = sort === 'price-asc' ? 'asc' : 'desc'

      // ابتدا شناسه محصولات منطبق با فیلترها را با Prisma پیدا می‌کنیم
      const matchingStones = await db.stone.findMany({
        where,
        select: { id: true },
      })

      const matchingIds = matchingStones.map(s => s.id)
      const total = matchingIds.length

      if (total === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        })
      }

      // مرتب‌سازی و صفحه‌بندی بر اساس قیمت با raw query ایمن (فقط شناسه‌ها)
      const sortedIds = await db.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT s.id
         FROM "Stone" s
         INNER JOIN "StonePrice" sp ON sp."stoneId" = s.id
           AND sp."isActive" = true
           AND sp.type = 'PER_SQM'
           AND sp.currency = 'IRR'
         WHERE s.id = ANY($1)
         ORDER BY sp.amount ${priceOrder === 'asc' ? 'ASC' : 'DESC'}
         LIMIT $2 OFFSET $3`,
        matchingIds,
        pageSize,
        (page - 1) * pageSize
      )

      const pagedStones = await db.stone.findMany({
        where: { id: { in: sortedIds.map(r => r.id) } },
        include: {
          category: true,
          images: { take: 1, orderBy: { order: 'asc' } },
          prices: { where: { isActive: true } },
          inventory: true,
        },
      })

      // حفظ ترتیب مرتب‌سازی SQL
      const idOrder = new Map(sortedIds.map((r, i) => [r.id, i]))
      pagedStones.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0))

      return NextResponse.json({
        success: true,
        data: pagedStones.map((stone) => ({ ...stone, inventory: stone.inventory?.[0] || null })),
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
    return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 })
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
    return NextResponse.json({ success: false, error: 'ایجاد محصول ناموفق بود' }, { status: 500 })
  }
}
