/**
 * `stone.color` یک برچسب فارسی است («کرم»، «عسلی»، ...) و نه یک رنگ CSS.
 *
 * دادنِ مستقیمِ آن به `style={{ background }}` باعث می‌شد نقطه‌ی رنگ در کارت
 * محصول همیشه خالی بماند.
 */
export const COLOR_SWATCHES: Record<string, string> = {
  'سفید': '#f8fafc',
  'کرم': '#f0dfbc',
  'کرم روشن': '#faf0dc',
  'کرم تیره': '#ddc9a3',
  'قهوه‌ای': '#8b5e34',
  'قرمز': '#b91c1c',
  'مشکی': '#1f2937',
  'خاکستری': '#9ca3af',
  'طلایی': '#d4af37',
  'سبز': '#4d7c0f',
  'عسلی': '#d99a3f',
  'بژ': '#e8d9bf',
}

/** اگر مقدار خودش رنگ CSS معتبر باشد همان را برمی‌گرداند، وگرنه نگاشت فارسی. */
export function resolveSwatch(color?: string | null): string | null {
  if (!color) return null

  const trimmed = String(color).trim()
  if (!trimmed) return null

  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^(?:rgb|hsl)a?\(/i.test(trimmed)) return trimmed

  return COLOR_SWATCHES[trimmed] || null
}

/**
 * بسته به اندپوینت، `inventory` آرایه است یا آبجکت.
 *
 * `/api/products` در مسیر مرتب‌سازی بر اساس قیمت آن را تخت می‌کند ولی در مسیر
 * عادی آرایه برمی‌گرداند، پس کارت محصول می‌نوشت «undefined m²».
 */
export function resolveInventory(value: unknown): { availableSqm?: number } | null {
  if (Array.isArray(value)) return value[0] || null
  if (value && typeof value === 'object') return value as { availableSqm?: number }
  return null
}
