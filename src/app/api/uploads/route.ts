export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { requireAuth } from '@/lib/auth'
import { storeImage } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN','SALES_MANAGER','OPERATOR'])
  if ('response' in auth) return auth.response
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limited = await rateLimit(`upload:${ip}`, 30, 60)
    if (!limited.allowed) return NextResponse.json({ success:false,error:'تعداد آپلودها بیش از حد مجاز است' }, { status:429 })
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'فایل تصویر ارسال نشده است' }, { status: 400 })
    const stored = await storeImage(file)
    const asset = await db.mediaAsset.create({ data: stored })
    await db.activityLog.create({ data: { userId: auth.user.id, action: 'UPLOAD_MEDIA', entity: 'MEDIA', entityId: asset.id, details: JSON.stringify({ name: asset.originalName, size: asset.size }) } })
    return NextResponse.json({ success: true, data: asset }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'آپلود ناموفق بود' }, { status: 400 })
  }
}
