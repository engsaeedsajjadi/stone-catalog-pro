/**
 * نگاشتِ مسیرهای درون‌برنامه‌ای (SPA) به URL واقعی مرورگر
 *
 * هدف:
 * - دکمه‌ی برگشت/جلو مرورگر کار کند
 * - هر تب/فیلتر/محصول قابل بوکمارک و اشتراک‌گذاری باشد
 * - لینک‌های قدیمی (?product=... و ?q=...) همچنان کار کنند
 *
 * مسیرهای واقعی Next (مثل /p/[slug] و /catalog) دست‌نخورده باقی می‌مانند؛
 * این ماژول فقط برای مسیر ریشه (/) است.
 */

export type AppRouteParams = Record<string, string>

/** کلیدهایی که خودمان معنای خاصی به آن‌ها می‌دهیم */
const RESERVED_KEYS = new Set(['route', 'product'])

/**
 * ساخت URL از روی route و params
 */
export function buildAppUrl(route: string, params: AppRouteParams = {}): string {
  const search = new URLSearchParams()

  // محصول از لینک قدیمی ?product=<id> پشتیبانی می‌شود
  if (route === 'product') {
    if (params.id) search.set('product', params.id)
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'id' && value) search.set(key, value)
    }
  } else if (route !== 'home') {
    search.set('route', route)
  }

  if (route !== 'product') {
    for (const [key, value] of Object.entries(params)) {
      if (RESERVED_KEYS.has(key) || !value) continue
      search.set(key, value)
    }
  }

  const query = search.toString()
  return query ? `/?${query}` : '/'
}

/**
 * خواندن route و params از روی URL
 *
 * اگر آدرس مربوط به مسیرهای واقعی Next باشد (مثل /p/slug)،
 * مقدار null برمی‌گردد تا چیزی در store تغییر نکند.
 */
export function parseAppLocation(
  href: string
): { route: string; params: AppRouteParams } | null {
  try {
    const url = new URL(href, 'http://localhost')

    if (url.pathname === '/catalog') {
      const params: AppRouteParams = {}
      url.searchParams.forEach((value, key) => {
        if (value) params[key] = value
      })
      return { route: 'catalog', params }
    }

    // مسیرهای واقعی Next را به خودش واگذار می‌کنیم
    if (url.pathname !== '/') return null

    const search = url.searchParams
    const params: AppRouteParams = {}

    // لینک عمیق محصول: /?product=<id>
    const productId = search.get('product')
    if (productId) {
      params.id = productId
      search.forEach((value, key) => {
        if (key !== 'product' && value) params[key] = value
      })
      return { route: 'product', params }
    }

    // لینک قدیمی جستجو: /?q=...
    const route = search.get('route') || (search.get('q') ? 'catalog' : 'home')

    search.forEach((value, key) => {
      if (key !== 'route' && value) params[key] = value
    })

    return { route, params }
  } catch {
    return null
  }
}

/**
 * آیا دو مجموعه param با هم برابرند؟
 */
export function sameParams(a: AppRouteParams, b: AppRouteParams): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => a[key] === b[key])
}
