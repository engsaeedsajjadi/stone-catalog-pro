import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashToken, verifyAccessToken } from '@/lib/security'

export const STAFF_ROLES = ['ADMIN', 'SALES_MANAGER', 'OPERATOR']
export type AuthUser = { id: string; email: string; name: string; role: string; phone?: string | null }

export async function getCurrentUser(req?: NextRequest): Promise<AuthUser | null> {
  const access = req ? req.cookies.get('stone_access')?.value : (await cookies()).get('stone_access')?.value
  if (!access) return null
  const claims = verifyAccessToken(access)
  if (!claims?.sid) return null
  const session = await db.session.findFirst({
    where: { id: claims.sid, userId: claims.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, email: true, name: true, role: true, phone: true, isActive: true } } },
  })
  if (!session?.user.isActive) return null
  const { id, email, name, role, phone } = session.user
  return { id, email, name, role, phone }
}

export async function requireAuth(req: NextRequest, roles?: string[]): Promise<{ response: NextResponse } | { user: AuthUser }> {
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

export type Viewer = { isAuthenticated: boolean; role: string | null; canViewTradePrices: boolean }

/**
 * نشست لغوشده یا کاربر غیرفعال نباید قیمت همکاری دریافت کند.
 *
 * برای تصمیم‌های نمایشی (مثل اینکه کدام لایه‌های قیمتی ارسال شوند)
 * استفاده می‌شود. تصمیم‌های امنیتیِ حساس حتماً باید از requireAuth
 * (که کاربر را از دیتابیس می‌خواند) استفاده کنند.
 */
export async function getViewer(req?: NextRequest): Promise<Viewer> {
  const user = await getCurrentUser(req)
  return { isAuthenticated: !!user, role: user?.role ?? null, canViewTradePrices: !!user && STAFF_ROLES.includes(user.role) }
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of ['stone_access', 'stone_refresh']) {
    response.cookies.set(name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  }
}
