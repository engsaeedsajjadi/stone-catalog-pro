/**
 * تنها منبع حقیقت برای تبدیل «route» های استور به مسیرهای واقعی Next.
 *
 * پیش از این، اپ دو روتر موازی داشت: روتر واقعی Next و یک روتر قلابی در
 * zustand. این فایل آن دو را به هم می‌چسباند تا `navigate()` واقعاً URL را
 * عوض کند و لینک‌ها قابل اشتراک‌گذاری و ایندکس شدن باشند.
 */

export const ROUTE_PATHS: Record<string, string> = {
  home: '/',
  catalog: '/catalog',
  export: '/catalog',
  compare: '/compare',
  favorites: '/favorites',
  about: '/about',
  contact: '/contact',
  login: '/login',
  admin: '/admin',
}

function buildSearch(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === false) continue
    const normalized = String(value).trim()
    if (!normalized) continue
    search.set(key, normalized)
  }

  const serialized = search.toString()
  return serialized ? `?${serialized}` : ''
}

/** یک route استور (و پارامترهایش) را به href واقعی تبدیل می‌کند. */
export function routeToHref(route: string, params: Record<string, string> = {}): string {
  if (!route) return '/'

  // لینک خارجی یا مسیر آماده را دست‌نخورده برگردان
  if (/^https?:\/\//i.test(route)) return route
  if (route.startsWith('/')) return route

  if (route === 'product') {
    const key = params.slug || params.code || params.id
    return key ? `/p/${encodeURIComponent(key)}` : '/catalog'
  }

  if (route === 'export') {
    return `/catalog${buildSearch({ ...params, export: 'true' })}`
  }

  const base = ROUTE_PATHS[route] || `/${route}`
  return `${base}${buildSearch(params)}`
}

/** عکس عملیات بالا: از pathname واقعی، route استور را حدس می‌زند. */
export function hrefToRoute(pathname: string): string {
  if (!pathname || pathname === '/') return 'home'
  if (pathname.startsWith('/p/')) return 'product'
  if (pathname.startsWith('/catalog')) return 'catalog'
  if (pathname.startsWith('/compare')) return 'compare'
  if (pathname.startsWith('/favorites')) return 'favorites'
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/contact')) return 'contact'
  if (pathname.startsWith('/login')) return 'login'
  if (pathname.startsWith('/admin')) return 'admin'
  return pathname.replace(/^\//, '')
}

/** آدرس قابل اشتراک‌گذاری یک محصول. slug ارجح است، بعد code، بعد id. */
export function productHref(stone: {
  slug?: string | null
  code?: string | null
  id?: string | null
} | null | undefined): string {
  const key = stone?.slug || stone?.code || stone?.id
  return key ? `/p/${encodeURIComponent(String(key))}` : '/catalog'
}
