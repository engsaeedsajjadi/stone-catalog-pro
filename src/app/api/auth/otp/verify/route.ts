export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'
import { db } from '@/lib/db'
import { hashPassword, hashToken, issueAccessToken, issueRefreshToken, REFRESH_TTL_MS } from '@/lib/security'
import { setAuthCookies } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

/**
 * تایید OTP و ورود کاربر
 *
 * نکته امنیتی: ایجاد خودکار حساب جدید فقط زمانی فعال می‌شود
 * که متغیر OTP_AUTO_CREATE=1 تنظیم شده باشد.
 * در غیر این صورت، کاربر باید قبلاً ثبت‌نام کرده باشد.
 */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const target = String(b.target || '').trim()
    const channel = b.channel === 'EMAIL' ? 'EMAIL' : 'SMS'
    const code = String(b.code || '')

    if (!target || !code) {
      return NextResponse.json(
        { success: false, error: 'هدف و کد تایید الزامی است' },
        { status: 400 }
      )
    }

    // محدودیت نرخ برای تلاش تایید
    const ip = getClientIp(req)
    const limited = await rateLimit(`otp-verify:${ip}:${target}`, 5, 300)
    if (!limited.allowed) {
      return NextResponse.json(
        { success: false, error: 'تعداد تلاش‌ها بیش از حد مجاز است' },
        { status: 429 }
      )
    }

    const isValid = await verifyOtp(target, channel, code)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'کد نامعتبر یا منقضی شده است' },
        { status: 401 }
      )
    }

    // یافتن کاربر موجود
    const email = channel === 'EMAIL' ? target : undefined
    const phone = channel === 'SMS' ? target : undefined

    let user = email
      ? await db.user.findUnique({ where: { email } })
      : phone
        ? await db.user.findFirst({ where: { phone } })
        : null

    // ایجاد خودکار حساب فقط با اجازه صریح از Environment
    const autoCreate = process.env.OTP_AUTO_CREATE === '1'

    if (!user && autoCreate) {
      const userEmail = channel === 'EMAIL' ? target : `${target.replace(/\D/g, '')}@otp.local`
      user = await db.user.create({
        data: {
          email: userEmail,
          password: await hashPassword(crypto.randomUUID()),
          name: target,
          phone: channel === 'SMS' ? target : undefined,
          role: 'OPERATOR',
        },
      })
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'حساب کاربری یافت نشد. ابتدا ثبت‌نام کنید.' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'حساب کاربری غیرفعال است' },
        { status: 403 }
      )
    }

    const access = issueAccessToken(user)
    const refresh = issueRefreshToken()

    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refresh),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || undefined,
      },
    })

    const res = NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    })

    await setAuthCookies(res, access, refresh)
    return res
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'تایید OTP ناموفق بود' },
      { status: 400 }
    )
  }
}
