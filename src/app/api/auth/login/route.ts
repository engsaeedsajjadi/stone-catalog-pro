export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashToken, issueAccessToken, issueRefreshToken, REFRESH_TTL_MS, verifyPassword } from '@/lib/security'
import { setAuthCookies } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limited = await rateLimit(`login:${ip}`, 10, 60)
    if (!limited.allowed) return NextResponse.json({ success:false,error:'تعداد تلاش‌ها بیش از حد مجاز است' }, { status:429 })
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!email || !password) return NextResponse.json({ success: false, error: 'ایمیل و رمز عبور الزامی است' }, { status: 400 })
    if (password.length > 200) return NextResponse.json({ success: false, error: 'رمز عبور بسیار طولانی است' }, { status: 400 })
    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.password)) return NextResponse.json({ success: false, error: 'ایمیل یا رمز عبور نادرست است' }, { status: 401 })
    if (!user.isActive) return NextResponse.json({ success: false, error: 'حساب کاربری غیرفعال است' }, { status: 403 })

    const refreshToken = issueRefreshToken()
    const accessToken = issueAccessToken(user)
    await db.session.create({ data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_MS), userAgent: req.headers.get('user-agent') || undefined, ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined } })
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await db.activityLog.create({ data: { userId: user.id, action: 'LOGIN', entity: 'USER', entityId: user.id, ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined, userAgent: req.headers.get('user-agent') || undefined } })

    const response = NextResponse.json({ success: true, data: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone } })
    await setAuthCookies(response, accessToken, refreshToken)
    return response
  } catch (e) { console.error('POST /api/auth/login error:', e); return NextResponse.json({ success: false, error: 'خطای داخلی سرور' }, { status: 500 }) }
}
