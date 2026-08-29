export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createOtp } from '@/lib/otp'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

/**
 * POST /api/auth/otp/request — درخواست کد OTP
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const target = String(body.target || '').trim()
    const channel = body.channel === 'EMAIL' ? 'EMAIL' : 'SMS'

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'شماره تماس یا ایمیل الزامی است' },
        { status: 400 }
      )
    }

    // محدودیت نرخ: ۳ درخواست در ۵ دقیقه
    const ip = getClientIp(req)
    const limited = await rateLimit(`otp:${ip}:${target}`, 3, 300)

    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, error: 'تعداد درخواست‌های OTP بیش از حد مجاز است' },
        { status: 429 }
      )
    }

    await createOtp(target, channel)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'سرویس OTP در دسترس نیست' },
      { status: 503 }
    )
  }
}
