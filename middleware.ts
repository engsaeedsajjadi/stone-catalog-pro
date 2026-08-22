import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_EXACT = new Set([
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/contact',
  '/api/compare',
  '/api/qr',
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

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  if (!path.startsWith('/api/')) return NextResponse.next()

  if (PUBLIC_EXACT.has(path)) return NextResponse.next()
  if (path === '/api/products' || path === '/api/categories') {
    return req.method === 'GET' ? NextResponse.next() : protect(req)
  }
  if (path.startsWith('/api/products/') || path.startsWith('/api/categories/')) {
    if (path.endsWith('/pdf') && req.method === 'GET') return NextResponse.next()
    if (req.method === 'GET' && !path.endsWith('/images')) return NextResponse.next()
    return protect(req)
  }
  if (path.startsWith('/api/media/')) return NextResponse.next()
  return protect(req)
}

async function protect(req: NextRequest) {
  const token = req.cookies.get('stone_access')?.value
  if (!token || !(await verifyAccessTokenEdge(token))) {
    return NextResponse.json({ success: false, error: 'احراز هویت الزامی است' }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = { matcher: ['/api/:path*'] }
