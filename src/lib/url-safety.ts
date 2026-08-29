/**
 * محافظت در برابر SSRF
 *
 * هر جای برنامه که به یک URLِ ذخیره‌شده در پایگاه‌داده درخواست می‌زند
 * (ارسال Webhook/Job، دریافت تصویر برای PDF و ...) باید ابتدا
 * assertSafeOutboundUrl را صدا بزند تا به شبکه‌ی داخلی/لوکال‌هاست
 * درخواستی ارسال نشود.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'metadata',
  'metadata.google.internal',
  'instance-data',
])

function ipv4ToInt(address: string): number | null {
  const parts = address.split('.')
  if (parts.length !== 4) return null

  let result = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const value = Number(part)
    if (value > 255) return null
    result = result * 256 + value
  }
  return result
}

function isPrivateIpv4(address: string): boolean {
  const value = ipv4ToInt(address)
  if (value === null) return false

  // 0.0.0.0/8
  if (value >>> 24 === 0) return true
  // 10.0.0.0/8
  if (value >>> 24 === 10) return true
  // 127.0.0.0/8
  if (value >>> 24 === 127) return true
  // 169.254.0.0/16 (link-local / cloud metadata)
  if ((value >>> 16) === 0xa9fe) return true
  // 172.16.0.0/12
  if ((value >>> 20) === 0xac1) return true
  // 192.168.0.0/16
  if ((value >>> 16) === 0xc0a8) return true
  // 192.0.0.0/24 و 198.18.0.0/15
  if (value >>> 24 === 192 && (value >>> 16) % 256 === 0) return true
  // 100.64.0.0/10 (CGNAT)
  if ((value >>> 22) === 0x190) return true

  return false
}

export type UrlSafetyResult = { ok: true; url: URL } | { ok: false; reason: string }

/**
 * بررسی امن بودن یک URL خروجی
 *
 * - فقط http/https مجاز است
 * - آدرس‌های داخلی/لوکال مسدود می‌شوند (مگر با ALLOW_PRIVATE_NETWORK=1)
 * - اگر OUTBOUND_ALLOWED_HOSTS تنظیم شده باشد، هاست باید در لیست باشد
 */
export function checkSafeOutboundUrl(rawUrl: unknown): UrlSafetyResult {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { ok: false, reason: 'URL معتبر نیست' }
  }

  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return { ok: false, reason: 'URL معتبر نیست' }
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, reason: 'فقط پروتکل http/https مجاز است' }
  }

  const allowPrivate = process.env.ALLOW_PRIVATE_NETWORK === '1'

  if (!allowPrivate && url.protocol === 'http:') {
    return { ok: false, reason: 'ارتباط خروجی باید روی https باشد' }
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')

  if (!allowPrivate) {
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return { ok: false, reason: 'دسترسی به هاست‌های داخلی مجاز نیست' }
    }

    if (isPrivateIpv4(hostname)) {
      return { ok: false, reason: 'دسترسی به شبکه‌ی داخلی مجاز نیست' }
    }

    if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80')) {
      return { ok: false, reason: 'دسترسی به شبکه‌ی داخلی مجاز نیست' }
    }
  }

  const allowList = (process.env.OUTBOUND_ALLOWED_HOSTS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  if (allowList.length > 0 && !allowList.includes(hostname)) {
    return { ok: false, reason: 'هاست مقصد در لیست مجاز نیست' }
  }

  return { ok: true, url }
}

/**
 * نسخه‌ی پرتاب‌کننده برای استفاده در مسیرها
 */
export function assertSafeOutboundUrl(rawUrl: unknown): URL {
  const result = checkSafeOutboundUrl(rawUrl)
  if (!result.ok) throw new Error(result.reason)
  return result.url
}
