export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, hashToken, issueAccessToken, issueRefreshToken, REFRESH_TTL_MS } from '@/lib/security'
import { setAuthCookies } from '@/lib/auth'
import crypto from 'node:crypto'

/**
 * GET /api/auth/google/callback — پردازش کال‌بک OAuth گوگل
 */
export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url)
    const code = u.searchParams.get('code')
    const state = u.searchParams.get('state')
    const cookieState = req.cookies.get('google_oauth_state')?.value

    // بررسی CSRF state
    if (!code || !state || state !== cookieState) {
      return NextResponse.json(
        { success: false, error: 'عدم تطابق state در OAuth' },
        { status: 400 }
      )
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth تنظیم نشده است')
    }

    // تبادل کد با توکن دسترسی
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResp.ok) {
      throw new Error('تبادل توکن گوگل ناموفق بود')
    }

    const tokenData = await tokenResp.json()

    // دریافت اطلاعات کاربر
    const infoResp = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    )

    if (!infoResp.ok) {
      throw new Error('دریافت اطلاعات کاربر گوگل ناموفق بود')
    }

    const info = await infoResp.json()

    if (!info.email) {
      return NextResponse.json(
        { success: false, error: 'حساب گوگل ایمیل ندارد' },
        { status: 400 }
      )
    }

    // یافتن یا ایجاد کاربر
    const email = info.email.toLowerCase()
    let user = await db.user.findUnique({ where: { email } })

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: info.name || info.email,
          password: await hashPassword(crypto.randomBytes(32).toString('hex')),
          role: 'OPERATOR',
        },
      })
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'حساب کاربری غیرفعال است' },
        { status: 403 }
      )
    }

    // ایجاد سشن
    const accessToken = issueAccessToken(user)
    const refreshToken = issueRefreshToken()

    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    })

    const res = NextResponse.redirect(new URL('/', req.url))
    await setAuthCookies(res, accessToken, refreshToken)
    res.cookies.delete('google_oauth_state')

    return res
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'ورود با گوگل ناموفق بود' },
      { status: 400 }
    )
  }
}
