export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { slugify } from '@/lib/slug'

const exportHeaders = ['کد محصول','نام','نام انگلیسی','دسته‌بندی','معدن','رنگ','ضخامت','عرض','طول','وزن','جذب آب','مقاومت فشاری','مقاومت سایشی','قیمت هر متر مربع (ریال)','قیمت هر اسلب (ریال)','قیمت صادراتی (USD)','تعداد اسلب','متراژ کل','متراژ موجود','وضعیت']

const normalize = (v: unknown) => String(v ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
const key = (v: unknown) => normalize(v).replace(/[يى]/g, 'ی').replace(/[ك]/g, 'ک').toLowerCase()
const num = (v: unknown) => {
  const normalized = String(v ?? '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[٬,]/g, '')
    .replace(/٫/g, '.')
    .trim()
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

function makeUniqueSlug(name: string, parentSlug?: string) {
  const base = slugify(name) || `category-${Date.now()}`
  return parentSlug ? `${parentSlug}-${base}` : base
}

async function getOrCreateCategory(name: string, parentId: string | null, order: number) {
  const clean = normalize(name)
  if (!clean) return null

  const existing = await db.category.findFirst({ where: { name: clean, parentId } })
  if (existing) {
    if (!existing.isActive) await db.category.update({ where: { id: existing.id }, data: { isActive: true } })
    return existing
  }

  const parent = parentId ? await db.category.findUnique({ where: { id: parentId }, select: { slug: true } }) : null
  let slug = makeUniqueSlug(clean, parent?.slug)
  const slugOwner = await db.category.findUnique({ where: { slug } })
  if (slugOwner) slug = `${slug}-${Date.now().toString(36)}`

  return db.category.create({
    data: { name: clean, slug, parentId, order, isActive: true },
  })
}

async function importCategories(rows: any[][]) {
  const result = { created: 0, updated: 0, errors: [] as string[] }
  if (!rows.length) return result

  const first = rows[0].map(key)
  const hasStructuredHeaders = first.some((h: string) => h === 'دسته اصلی' || h === 'دسته‌بندی')

  if (hasStructuredHeaders) {
    const mainIndex = first.findIndex((h: string) => h === 'دسته اصلی' || h === 'دسته بندی' || h === 'دسته‌بندی')
    const subIndex = first.findIndex((h: string) => h === 'زیر دسته' || h === 'زیر‌دسته' || h === 'زیر‌دسته‌بندی')
    for (let i = 1; i < rows.length; i++) {
      try {
        const mainName = normalize(rows[i][mainIndex])
        const subName = subIndex >= 0 ? normalize(rows[i][subIndex]) : ''
        if (!mainName) continue
        const beforeMain = await db.category.findFirst({ where: { name: mainName, parentId: null } })
        const main = await getOrCreateCategory(mainName, null, i)
        if (!main) continue
        beforeMain ? result.updated++ : result.created++
        if (subName) {
          const beforeSub = await db.category.findFirst({ where: { name: subName, parentId: main.id } })
          await getOrCreateCategory(subName, main.id, i)
          beforeSub ? result.updated++ : result.created++
        }
      } catch (e) {
        result.errors.push(`سطر ${i + 1}: ${e instanceof Error ? e.message : 'خطا در ایجاد دسته'}`)
      }
    }
    return result
  }

  // Matrix format used by the user's original category Excel:
  // row 1 = main category names; rows below = children under each column.
  const mainNames = rows[0].map(normalize)
  for (let col = 0; col < mainNames.length; col++) {
    const mainName = mainNames[col]
    if (!mainName) continue
    try {
      const beforeMain = await db.category.findFirst({ where: { name: mainName, parentId: null } })
      const main = await getOrCreateCategory(mainName, null, col + 1)
      if (!main) continue
      beforeMain ? result.updated++ : result.created++

      let childOrder = 1
      for (let row = 1; row < rows.length; row++) {
        const childName = normalize(rows[row][col])
        if (!childName) continue
        const beforeChild = await db.category.findFirst({ where: { name: childName, parentId: main.id } })
        await getOrCreateCategory(childName, main.id, childOrder++)
        beforeChild ? result.updated++ : result.created++
      }
    } catch (e) {
      result.errors.push(`ستون ${col + 1} (${mainName}): ${e instanceof Error ? e.message : 'خطا در ایجاد دسته'}`)
    }
  }
  return result
}

function rowObject(headers: string[], row: any[]) {
  const obj: Record<string, any> = {}
  headers.forEach((h, i) => { obj[key(h)] = row[i] })
  return obj
}

function value(obj: Record<string, any>, ...names: string[]) {
  for (const name of names) {
    const v = obj[key(name)]
    if (v !== undefined && normalize(v) !== '') return v
  }
  return ''
}

async function importProducts(rows: any[][]) {
  const result = { created: 0, updated: 0, errors: [] as string[] }
  if (rows.length < 2) return result

  const headers = rows[0].map(normalize)
  const warehouse = await db.warehouse.findFirst({ where: { OR: [{ code: 'MAIN' }, { isActive: true }], isActive: true }, orderBy: { createdAt: 'asc' } })

  const statusMap: Record<string, string> = {
    'موجود': 'AVAILABLE', 'ناموجود': 'OUT_OF_STOCK', 'پیش‌فروش': 'PRE_ORDER',
    'سفارشی': 'CUSTOM', 'در حال تولید': 'IN_PRODUCTION', 'غیرفعال': 'INACTIVE', 'پیش‌نویس': 'DRAFT',
  }

  for (let i = 1; i < rows.length; i++) {
    const o = rowObject(headers, rows[i])
    const name = normalize(value(o, 'نام محصول', 'نام'))
    const code = normalize(value(o, 'SKU', 'کد محصول', 'کد'))
    const mainName = normalize(value(o, 'دسته اصلی', 'دسته‌بندی', 'دسته بندی'))
    const subName = normalize(value(o, 'زیر‌دسته', 'زیر دسته', 'زیر‌دسته‌بندی'))
    if (!name && !code) continue
    if (!name || !code || !mainName) {
      result.errors.push(`سطر ${i + 1}: نام محصول، SKU و دسته اصلی الزامی است`)
      continue
    }

    try {
      const main = await getOrCreateCategory(mainName, null, i)
      if (!main) throw new Error('دسته اصلی نامعتبر است')
      const category = subName ? await getOrCreateCategory(subName, main.id, i) : main

      const existing = await db.stone.findUnique({ where: { code } })
      const statusRaw = normalize(value(o, 'وضعیت'))
      const data: any = {
        name,
        nameEn: normalize(value(o, 'نام انگلیسی')) || null,
        code,
        categoryId: category!.id,
        quarry: normalize(value(o, 'نام معدن', 'معدن')) || null,
        color: normalize(value(o, 'رنگ اصلی', 'رنگ')) || null,
        colorSecondary: normalize(value(o, 'رنگ ثانویه')) || null,
        processingType: normalize(value(o, 'نوع فرآوری')) || null,
        surfaceFinish: normalize(value(o, 'سطح پرداخت')) || null,
        thickness: normalize(value(o, 'ضخامت (mm)', 'ضخامت')) || null,
        width: normalize(value(o, 'عرض (cm)', 'عرض')) || null,
        length: normalize(value(o, 'طول (cm)', 'طول')) || null,
        weight: normalize(value(o, 'وزن')) || null,
        density: normalize(value(o, 'چگالی (g/cm³)', 'چگالی')) || null,
        waterAbsorption: normalize(value(o, 'جذب آب (%)', 'جذب آب')) || null,
        compressiveStrength: normalize(value(o, 'مقاومت فشاری (MPa)', 'مقاومت فشاری')) || null,
        abrasionResistance: normalize(value(o, 'مقاومت سایشی')) || null,
        application: normalize(value(o, 'کاربرد')) || null,
        suitableFor: normalize(value(o, 'مناسب برای')) || null,
        exportCountries: normalize(value(o, 'کشورهای صادراتی')) || null,
        description: normalize(value(o, 'توضیحات فارسی', 'توضیحات')) || null,
        tags: normalize(value(o, 'فرم محصول')) || null,
        isFeatured: normalize(value(o, 'محصول اصلی')) === 'بله',
        isNewest: normalize(value(o, 'جدید')) === 'بله',
        isBestSeller: normalize(value(o, 'پرفروش')) === 'بله',
        isExportGrade: normalize(value(o, 'صادراتی')) === 'بله',
        status: statusMap[statusRaw] || (statusRaw || 'AVAILABLE'),
      }

      let stone
      if (existing) {
        stone = await db.stone.update({ where: { id: existing.id }, data })
        result.updated++
      } else {
        stone = await db.stone.create({ data })
        result.created++
      }

        const pricePairs = [
        ['PER_SQM', 'IRR', value(o,
          'قیمت هر m² (ریال)', 'قیمت هر متر مربع (ریال)',
          'قیمت هر مترمربع (ریال)', 'قیمت متر مربع',
          'قیمت هر متر مربع', 'قیمت m²', 'قیمت')],
        ['PER_SLAB', 'IRR', value(o,
          'قیمت هر اسلب (ریال)', 'قیمت اسلب', 'قیمت هر اسلب')],
        ['EXPORT', 'USD', value(o,
          'قیمت صادراتی (USD/m²)', 'قیمت صادراتی (USD)', 'قیمت صادراتی')],
      ] as const
      for (const [type, currency, raw] of pricePairs) {
        if (normalize(raw) === '') continue
        const existingPrice = await db.stonePrice.findFirst({ where: { stoneId: stone.id, type, currency } })
        if (existingPrice) {
          await db.stonePrice.update({ where: { id: existingPrice.id }, data: { amount: num(raw), isActive: true, updatedAt: new Date() } })
        } else {
          await db.stonePrice.create({ data: { stoneId: stone.id, type, currency, amount: num(raw), isActive: true } })
        }
      }

      if (warehouse) {
        const inventoryValues = {
          slabCount: Math.round(num(value(o, 'تعداد اسلب'))),
          totalSqm: num(value(o, 'موجودی کل (m²)', 'متراژ کل')),
          availableSqm: num(value(o, 'موجودی', 'متراژ موجود')),
          reservedSqm: 0,
          lastUpdated: new Date(),
        }
        inventoryValues.reservedSqm = Math.max(0, inventoryValues.totalSqm - inventoryValues.availableSqm)
        await db.inventory.upsert({
          where: { stoneId_warehouseId: { stoneId: stone.id, warehouseId: warehouse.id } },
          update: inventoryValues,
          create: { stoneId: stone.id, warehouseId: warehouse.id, ...inventoryValues },
        })
      }
    } catch (e) {
      result.errors.push(`سطر ${i + 1} (${code}): ${e instanceof Error ? e.message : 'خطا در ثبت محصول'}`)
    }
  }
  return result
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN','SALES_MANAGER','OPERATOR'])
  if ('response' in auth) return auth.response
  try {
    const stones = await db.stone.findMany({ include: { category: true, prices: { where: { isActive: true } }, inventory: { include: { warehouse: true } } }, orderBy: { code: 'asc' } })
    const rows = stones.map(s => {
      const price = (type:string,currency:string) => s.prices.find(p => p.type === type && p.currency === currency)?.amount ?? ''
      const inv = s.inventory.reduce((a,i)=>({ slabCount:a.slabCount+i.slabCount, totalSqm:a.totalSqm+i.totalSqm, availableSqm:a.availableSqm+i.availableSqm }), {slabCount:0,totalSqm:0,availableSqm:0})
      return [s.code,s.name,s.nameEn||'',s.category.name,s.quarry||'',s.color||'',s.thickness||'',s.width||'',s.length||'',s.weight||'',s.waterAbsorption||'',s.compressiveStrength||'',s.abrasionResistance||'',price('PER_SQM','IRR'),price('PER_SLAB','IRR'),price('EXPORT','USD'),inv.slabCount,inv.totalSqm,inv.availableSqm,s.status]
    })
    const wb=XLSX.utils.book_new(); const ws=XLSX.utils.aoa_to_sheet([exportHeaders,...rows]); XLSX.utils.book_append_sheet(wb,ws,'Stones')
    const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'})
    return new NextResponse(out,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition': `attachment; filename="stones-${new Date().toISOString().slice(0,10)}.xlsx"`}})
  } catch (e) { console.error(e); return NextResponse.json({ success:false, error:'Export failed' },{status:500}) }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'SALES_MANAGER'])
  if ('response' in auth) return auth.response
  try {
    const form = await req.formData()
    const file = form.get('file')
    const requestedMode = normalize(form.get('mode') || '')
    if (!(file instanceof File)) return NextResponse.json({success:false,error:'فایل Excel ارسال نشده است'},{status:400})

    const buffer=Buffer.from(await file.arrayBuffer())
    const wb=XLSX.read(buffer,{type:'buffer'})
    const ws=wb.Sheets[wb.SheetNames[0]]
    const rows=XLSX.utils.sheet_to_json<any[]>(ws,{header:1,defval:'',raw:true})
    if(rows.length<1) return NextResponse.json({success:false,error:'فایل خالی است'},{status:400})

    // Detect the import type from the Excel headers when the UI does not
    // explicitly send a mode. This prevents the full Product template from
    // accidentally falling into the legacy pricing importer.
    const firstHeaders = (rows[0] || []).map(key)
    const hasCategoryHeaders = firstHeaders.some((h:string) =>
      ['دسته اصلی','دسته بندی','دسته‌بندی','زیر دسته','زیر‌دسته'].map(key).includes(h)
    )
    const hasProductHeaders =
      firstHeaders.includes(key('کد محصول')) ||
      firstHeaders.includes(key('SKU')) ||
      firstHeaders.includes(key('نام محصول')) ||
      firstHeaders.includes(key('دسته اصلی'))

    let mode = key(requestedMode)
    if (!mode || mode === 'pricing' || mode === 'قیمت') {
      if (hasCategoryHeaders && !hasProductHeaders) mode = 'categories'
      else if (hasProductHeaders) mode = 'products'
      else mode = 'pricing'
    }

    let result: any
    if (mode === 'categories' || mode === 'دسته بندی' || mode === 'دسته‌بندی') result = await importCategories(rows)
    else if (mode === 'products' || mode === 'product' || mode === 'محصولات' || mode === 'محصول') result = await importProducts(rows)
    else {
      // Legacy price/inventory import remains supported.
      if(rows.length<2) return NextResponse.json({success:false,error:'فایل خالی است'},{status:400})
      result={updated:0,created:0,errors:[] as string[]}
      for(let i=1;i<rows.length;i++){
        const r=rows[i]; const code=normalize(r[0]); if(!code){result.errors.push(`سطر ${i+1}: کد محصول خالی است`);continue}
        try{
          const stone=await db.stone.findUnique({where:{code}}); if(!stone){result.errors.push(`سطر ${i+1}: محصول ${code} وجود ندارد`);continue}
          const headers = rows[0].map(key)
          const findIndex = (...names:string[]) => {
            const targets = names.map(key)
            return headers.findIndex((h:string) => targets.includes(h))
          }
          const priceIndex = findIndex('قیمت هر m² (ریال)','قیمت هر متر مربع (ریال)','قیمت هر مترمربع (ریال)','قیمت متر مربع','قیمت هر متر مربع','قیمت m²','قیمت')
          const slabPriceIndex = findIndex('قیمت هر اسلب (ریال)','قیمت اسلب','قیمت هر اسلب')
          const exportPriceIndex = findIndex('قیمت صادراتی (USD/m²)','قیمت صادراتی (USD)','قیمت صادراتی')
          const slabCountIndex = findIndex('تعداد اسلب')
          const totalSqmIndex = findIndex('موجودی کل (m²)','متراژ کل')
          const availableSqmIndex = findIndex('موجودی (m²)','موجودی','متراژ موجود')

          const upsertLegacyPrice = async (type:string, currency:string, raw:any) => {
            if (normalize(raw) === '') return
            const amount = num(raw)
            const existingPrice = await db.stonePrice.findFirst({where:{stoneId:stone.id,type,currency}})
            if (existingPrice) await db.stonePrice.update({where:{id:existingPrice.id},data:{amount,isActive:true,updatedAt:new Date()}})
            else await db.stonePrice.create({data:{stoneId:stone.id,type,currency,amount,isActive:true}})
          }

          await upsertLegacyPrice('PER_SQM','IRR', priceIndex >= 0 ? r[priceIndex] : r[13])
          await upsertLegacyPrice('PER_SLAB','IRR', slabPriceIndex >= 0 ? r[slabPriceIndex] : r[14])
          await upsertLegacyPrice('EXPORT','USD', exportPriceIndex >= 0 ? r[exportPriceIndex] : r[15])

          const slabCount = slabCountIndex >= 0 ? num(r[slabCountIndex]) : num(r[16])
          const totalSqm = totalSqmIndex >= 0 ? num(r[totalSqmIndex]) : num(r[17])
          const availableSqm = availableSqmIndex >= 0 ? num(r[availableSqmIndex]) : num(r[18])
          await db.inventory.updateMany({where:{stoneId:stone.id},data:{slabCount:Math.round(slabCount),totalSqm,availableSqm,reservedSqm:Math.max(0,totalSqm-availableSqm),lastUpdated:new Date()}})
          result.updated++
        }catch(e){result.errors.push(`سطر ${i+1}: ${e instanceof Error?e.message:'خطا'}`)}
      }
    }

    await db.activityLog.create({data:{userId:auth.user.id,action:'EXCEL_IMPORT',entity:mode === 'categories' ? 'CATEGORY' : 'PRODUCT',details:JSON.stringify(result)}})
    return NextResponse.json({success:true,data:result})
  }catch(e){console.error('POST /api/excel error:',e);return NextResponse.json({success:false,error:e instanceof Error ? e.message : 'Import failed'},{status:400})}
}
