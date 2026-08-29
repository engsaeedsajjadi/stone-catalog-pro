import { NextRequest, NextResponse } from 'next/server'
import { isCsrfSafe } from '@/lib/csrf'

/**
 * Endpointهای عمومی به‌همراه متد مجاز
 *
 * توجه: تعیین متد اهمیت دارد؛ مثلاً POST /api/inquiries باید برای
 * بازدیدکننده‌ی ناشناس باز باشد، ولی GET همان مسیر (لیست استعلام‌ها)
 * فقط برای کاربران واردشده.
 */
const PUBLIC_ROUTES = new Map<string, Set<string>>([
  ['/api/auth/login', new Set(['POST'])],
  ['/api/auth/me', new Set(['GET'])],
  ['/api/auth/logout', new Set(['POST'])],
  ['/api/auth/refresh', new Set(['POST'])],
  ['/api/auth/otp/request', new Set(['POST'])],
  ['/api/auth/otp/verify', new Set(['POST'])],
  ['/api/auth/password-reset/request', new Set(['POST'])],
  ['/api/auth/password-reset/confirm', new Set(['POST'])],
  ['/api/auth/google/start', new Set(['GET'])],
  ['/api/auth/google/callback', new Set(['GET'])],
  ['/api/contact', new Set(['POST'])],
  ['/api/compare', new Set(['GET'])],
  ['/api/inquiries', new Set(['POST'])],
  ['/api/qr', new Set(['GET'])],
  ['/api/settings/public', new Set(['GET'])],
  ['/api/site-config', new Set(['GET'])],
])

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? normalized : normalized + '='.repeat(4 - (normalized.length % 4))
  const binary = atob(pad)
  return Uint8Array.from(binary, c => c.charCodeAt(0))
}

async function verifyAccessTokenEdge(token: string) {
  try {
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) return false
    const secret = process.env.JWT_SECRET
    if (!secret || secret.length < 32) return false
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as { exp?: number }
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return false
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    return await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signature),
      new TextEncoder().encode(`${header}.${body}`),
    )
  } catch {
    return false
  }
}

function isPublicRoute(path: string, method: string) {
  const methods = PUBLIC_ROUTES.get(path)
  return methods ? methods.has(method) : false
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // صفحات غیر-API نیاز به پردازش ندارند
  if (!path.startsWith('/api/')) return NextResponse.next()

  // بررسی CSRF برای تمام درخواست‌های غیر-GET
  if (!isCsrfSafe(req)) {
    return NextResponse.json(
      { success: false, error: 'درخواست CSRF نامعتبر است' },
      { status: 403 }
    )
  }

  // Endpointهای عمومی (با تفکیک متد)
  if (isPublicRoute(path, req.method)) return NextResponse.next()

  // محصولات و دسته‌بندی: GET عمومی، سایر متدها محافظت‌شده
  if (path === '/api/products' || path === '/api/categories') {
    return req.method === 'GET' ? NextResponse.next() : protect(req)
  }

  if (path.startsWith('/api/products/') || path.startsWith('/api/categories/')) {
    // PDF و تصاویر عمومی هستند
    if (path.endsWith('/pdf') && req.method === 'GET') return NextResponse.next()
    // GET عمومی (به‌جز /images که نیاز به auth دارد)
    if (req.method === 'GET' && !path.endsWith('/images')) return NextResponse.next()
    return protect(req)
  }

  // فایل‌های رسانه‌ای عمومی
  if (path.startsWith('/api/media/')) return NextResponse.next()

  // جستجو عمومی با محدودیت نرخ (در هندلر بررسی می‌شود)
  if (path === '/api/search' && req.method === 'GET') return NextResponse.next()

  // سایر endpointها نیاز به احراز هویت دارند
  return protect(req)
}

async function protect(req: NextRequest) {
  const token = req.cookies.get('stone_access')?.value
  if (!token || !(await verifyAccessTokenEdge(token))) {
    return NextResponse.json(
      { success: false, error: 'احراز هویت الزامی است' },
      { status: 401 }
    )
  }
  return NextResponse.next()
}

export const config = { matcher: ['/api/:path*'] }
