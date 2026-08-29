/**
 * محافظت CSRF
 *
 * کوکی‌ها با SameSite=Lax ارسال می‌شوند، اما برای اطمینان بیشتر
 * (و پوشش مرورگرها/سناریوهای خاص) مبدأ درخواست هم بررسی می‌شود.
 *
 * قاعده: برای متدهای غیر-GET حتماً باید Origin یا Referer معتبر و
 * منطبق با Host ارسال شود؛ مگر اینکه کلاینت توکن ماشینی
 * (هدر x-api-token برابر با API_TOKEN) را ارسال کند.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function isCsrfSafe(req: { method: string; headers: Headers }): boolean {
  if (SAFE_METHODS.has(req.method)) return true

  const apiToken = process.env.API_TOKEN
  if (apiToken && req.headers.get('x-api-token') === apiToken) return true

  const host = req.headers.get('host')
  if (!host) return false

  const candidate = req.headers.get('origin') || req.headers.get('referer')
  if (!candidate) return false

  try {
    return new URL(candidate).host === host
  } catch {
    return false
  }
}
