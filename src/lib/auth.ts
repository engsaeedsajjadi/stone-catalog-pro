import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashToken, verifyAccessToken } from '@/lib/security'

export type AuthUser = { id: string; email: string; name: string; role: string }

export async function getCurrentUser(req?: NextRequest): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const access = cookieStore.get('stone_access')?.value || req?.cookies.get('stone_access')?.value
  if (!access) return null
  const claims = verifyAccessToken(access)
  if (!claims) return null
  const user = await db.user.findUnique({ where: { id: claims.sub }, select: { id: true, email: true, name: true, role: true, isActive: true } })
  if (!user?.isActive) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export async function requireAuth(req: NextRequest, roles?: string[]) {
  const user = await getCurrentUser(req)
  if (!user) return { response: NextResponse.json({ success: false, error: 'احراز هویت الزامی است' }, { status: 401 }) }
  if (roles?.length && !roles.includes(user.role)) {
    return { response: NextResponse.json({ success: false, error: 'دسترسی کافی ندارید' }, { status: 403 }) }
  }
  return { user }
}

export async function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === 'production'
  response.cookies.set('stone_access', accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 15 * 60 })
  response.cookies.set('stone_refresh', refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60 })
}

export function refreshTokenHash(token: string) { return hashToken(token) }

export type Viewer = { isAuthenticated: boolean; role: string | null }

/**
 * تشخیص بازدیدکننده بدون کوئری به پایگاه‌داده
 *
 * برای تصمیم‌های نمایشی (مثل اینکه کدام لایه‌های قیمتی ارسال شوند)
 * استفاده می‌شود. تصمیم‌های امنیتیِ حساس حتماً باید از requireAuth
 * (که کاربر را از دیتابیس می‌خواند) استفاده کنند.
 */
export async function getViewer(req?: NextRequest): Promise<Viewer> {
  const cookieStore = await cookies()
  const access = cookieStore.get('stone_access')?.value || req?.cookies.get('stone_access')?.value
  if (!access) return { isAuthenticated: false, role: null }

  const claims = verifyAccessToken(access)
  if (!claims) return { isAuthenticated: false, role: null }

  return { isAuthenticated: true, role: claims.role ?? null }
}
