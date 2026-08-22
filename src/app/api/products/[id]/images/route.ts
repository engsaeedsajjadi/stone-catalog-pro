export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ['ADMIN','SALES_MANAGER','OPERATOR'])
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    const { mediaAssetId, alt, type = 'GALLERY', isPrimary = false, order = 0 } = await req.json()
    if (!mediaAssetId) return NextResponse.json({ success: false, error: 'mediaAssetId الزامی است' }, { status: 400 })
    const asset = await db.mediaAsset.findUnique({ where: { id: mediaAssetId } })
    const stone = await db.stone.findUnique({ where: { id } })
    if (!asset || !stone) return NextResponse.json({ success: false, error: 'منبع یا محصول پیدا نشد' }, { status: 404 })
    if (isPrimary) await db.stoneImage.updateMany({ where: { stoneId: id }, data: { isPrimary: false } })
    const image = await db.stoneImage.create({ data: { stoneId: id, mediaAssetId: asset.id, url: asset.url, thumbnail: asset.url, alt, type, isPrimary, order } })
    await db.stoneAuditLog.create({ data: { stoneId: id, userId: auth.user.id, action: 'IMAGE_UPLOAD', newValue: image.id } })
    return NextResponse.json({ success: true, data: image }, { status: 201 })
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'خطا در اتصال تصویر' }, { status: 400 }) }
}
