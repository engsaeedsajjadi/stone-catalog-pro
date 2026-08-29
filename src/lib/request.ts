import type { NextRequest } from 'next/server'

/**
 * استخراج IP کلاینت
 *
 * هدر X-Forwarded-For توسط کلاینت قابل جعل است. اگر برنامه مستقیماً
 * (بدون پروکسی معتبر مثل Caddy/Nginx) در معرض اینترنت باشد، باید
 * TRUST_PROXY=0 تنظیم شود تا برای محدودیت نرخ از آن استفاده نشود.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers
  const trustProxy = process.env.TRUST_PROXY !== '0'

  if (trustProxy) {
    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) {
      const first = forwarded.split(',')[0]?.trim()
      if (first) return first
    }

    const realIp = headers.get('x-real-ip')
    if (realIp) return realIp.trim()
  }

  return 'unknown'
}

/**
 * محدودیت اندازه‌ی بدنه‌ی درخواست
 *
 * Route Handlerهای نکست به‌طور پیش‌فرض محدودیتی ندارند، بنابراین قبل از
 * خواندن formData/arrayBuffer باید اندازه بررسی شود تا سرور با یک درخواست
 * بزرگ از حافظه خارج نشود.
 */
export function getContentLength(req: NextRequest | Request): number {
  const raw = req.headers.get('content-length')
  if (!raw) return 0
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function isContentTooLarge(req: NextRequest | Request, maxBytes: number): boolean {
  const length = getContentLength(req)
  // اگر هدر وجود نداشت (chunked)، اجازه می‌دهیم و در ادامه اندازه‌ی واقعی بررسی می‌شود
  return length > maxBytes
}

/**
 * بروز خطای ۴۱۳ استاندارد
 */
export class PayloadTooLargeError extends Error {
  constructor(maxMb: number) {
    super(`حجم فایل ارسالی بیش از حد مجاز است (حداکثر ${maxMb} مگابایت)`)
    this.name = 'PayloadTooLargeError'
  }
}
