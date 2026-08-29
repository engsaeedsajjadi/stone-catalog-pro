/*
 * Service Worker
 *
 * نکات مهم:
 * - فقط پاسخ‌های GETِ استاتیک کش می‌شوند؛ پاسخ‌های API هرگز کش نمی‌شوند
 *   (در نسخه‌ی قبلی همه‌چیز از جمله /api/* کش می‌شد و داده‌ی کهنه می‌ماند)
 * - با هر تغییر نسخه، کش‌های قدیمی پاک می‌شوند
 */

const CACHE = 'stone-catalog-v2'
const MAX_CACHE_ENTRIES = 80

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/'])).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

function shouldCache(request, response) {
  if (request.method !== 'GET') return false
  if (!response || !response.ok || response.type !== 'basic') return false

  const url = new URL(request.url)

  // فقط منابع هم‌مبدأ، و نه مسیرهای API/احراز هویت
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/')) return false
  if (url.pathname.startsWith('/_next/data/')) return false

  return true
}

async function trimCache(cache) {
  const keys = await cache.keys()
  if (keys.length <= MAX_CACHE_ENTRIES) return
  const extra = keys.slice(0, keys.length - MAX_CACHE_ENTRIES)
  await Promise.all(extra.map((key) => cache.delete(key)))
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // APIها همیشه مستقیماً از شبکه
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request)

      const network = fetch(request)
        .then((response) => {
          if (shouldCache(request, response)) {
            const copy = response.clone()
            cache.put(request, copy).then(trimCache).catch(() => {})
          }
          return response
        })
        .catch(() => cached || Response.error())

      // استراتژی stale-while-revalidate برای منابع استاتیک
      return cached || network
    })()
  )
})
