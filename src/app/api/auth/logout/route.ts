export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { hashToken } from '@/lib/security'

/**
 * POST /api/auth/logout — خروج کاربر و باطل کردن سشن
 */
export async function POST() {
  const c = await cookies()
  const refresh = c.get('stone_refresh')?.value

  // باطل کردن سشن فعلی در دیتابیس
  if (refresh) {
    await db.session.updateMany({
      where: { tokenHash: hashToken(refresh), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  const response = NextResponse.json({ success: true })

  // حذف کوکی‌ها
  response.cookies.set('stone_access', '', { httpOnly: true, expires: new Date(0), path: '/' })
  response.cookies.set('stone_refresh', '', { httpOnly: true, expires: new Date(0), path: '/' })

  return response
}
