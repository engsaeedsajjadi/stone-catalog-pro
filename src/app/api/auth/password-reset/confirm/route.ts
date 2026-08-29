export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, hashToken } from '@/lib/security'

/**
 * POST /api/auth/password-reset/confirm — تایید بازیابی رمز عبور
 */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (String(password || '').length < 12) {
      return NextResponse.json(
        { success: false, error: 'رمز باید حداقل ۱۲ کاراکتر باشد' },
        { status: 400 }
      )
    }

    const row = await db.passwordResetToken.findFirst({
      where: {
        tokenHash: hashToken(String(token || '')),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!row) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر یا منقضی شده است' },
        { status: 400 }
      )
    }

    await db.$transaction([
      db.user.update({
        where: { id: row.userId },
        data: { password: await hashPassword(password) },
      }),
      db.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ])

    // باطل کردن تمام سشن‌های فعال کاربر
    await db.session.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'بازیابی رمز ناموفق بود' },
      { status: 400 }
    )
  }
}
