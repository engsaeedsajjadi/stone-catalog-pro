export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * تنظیمات عمومی سایت
 *
 * تنها کلیدهایی که قرار است روی سایت عمومی نمایش داده شوند در دسترس هستند؛
 * کل مسیر /api/settings (که ممکن است شامل تنظیمات حساس باشد) فقط برای
 * مدیران قابل دسترسی است.
 */
const PUBLIC_SETTING_KEYS = [
  'company.phone',
  'company.email',
  'company.address',
  'company.whatsapp',
  'company.workingHours',
]

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: PUBLIC_SETTING_KEYS } },
    })

    const map: Record<string, string> = {}
    for (const setting of settings) {
      map[setting.key] = setting.value
    }

    return NextResponse.json({ success: true, data: map })
  } catch {
    return NextResponse.json(
      { success: false, error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}
