export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashToken, issueRefreshToken } from '@/lib/security'
import { sendNotification } from '@/lib/notifications'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

/**
 * POST /api/auth/password-reset/request — درخواست بازیابی رمز عبور
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, error: 'ایمیل الزامی است' },
        { status: 400 }
      )
    }

    // محدودیت نرخ: ۳ درخواست در ۱۵ دقیقه
    const ip = getClientIp(req)
    const limited = await rateLimit(`pw-reset:${ip}:${normalizedEmail}`, 3, 900)

    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
        { status: 429 }
      )
    }

    // همیشه موفق برمی‌گردد تا اطلاعات وجود کاربر را فاش نکند
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    const token = issueRefreshToken()

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    const base = process.env.NEXT_PUBLIC_APP_URL
    if (!base) {
      throw new Error('NEXT_PUBLIC_APP_URL تنظیم نشده است')
    }

    // ارسال لینک بازیابی از طریق نوتیفیکیشن
    await sendNotification(
      'EMAIL',
      user.email,
      'بازیابی رمز عبور',
      `${base}/reset-password?token=${encodeURIComponent(token)}`
    )

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'سرویس بازیابی رمز تنظیم نشده است' },
      { status: 503 }
    )
  }
}
