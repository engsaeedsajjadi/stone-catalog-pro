export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const settingsUpdateSchema = z.record(
  z.string().min(1).max(100),
  z.string().max(10000)
).refine(
  (obj) => Object.keys(obj).length <= 50,
  { message: 'حداکثر ۵۰ تنظیم قابل ارسال است' }
)

export async function GET() {
  try {
    const settings = await db.setting.findMany()
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value
    return NextResponse.json({ success: true, data: map })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response
  try {
    const body = settingsUpdateSchema.parse(await req.json())
    for (const [k, v] of Object.entries(body)) {
      await db.setting.upsert({
        where: { key: k },
        create: { key: k, value: v, category: 'GENERAL', type: 'TEXT' },
        update: { value: v },
      })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'بروزرسانی ناموفق بود' }, { status: 500 })
  }
}
