/**
 * نرمال‌سازی شکلِ خروجیِ موجودی (Inventory)
 *
 * مشکل قبلی:
 * - GET /api/products  در شاخه‌ی پیش‌فرض  => inventory یک «آرایه» بود
 * - GET /api/products  در شاخه‌ی مرتب‌سازی قیمت => inventory یک «آبجکت» بود
 * - GET /api/products/[id]                 => inventory یک «آبجکت» بود
 *
 * این ناهماهنگی باعث می‌شد تب موجودی پنل همیشه صفر نشان بدهد
 * و فرم ویرایش موجودیِ واقعی را با صفر بازنویسی کند.
 *
 * از این به بعد «یک منبع حقیقت» داریم:
 * همیشه `inventory` یا یک آبجکت است یا null.
 */

type AnyRecord = Record<string, any>

function flattenInventory(inventory: unknown): AnyRecord | null {
  if (!inventory) return null

  const record = Array.isArray(inventory) ? inventory[0] : inventory
  if (!record || typeof record !== 'object') return null

  const inv = record as AnyRecord

  return {
    ...inv,
    warehouseName: inv.warehouse?.name ?? inv.warehouseName ?? null,
    warehouseCode: inv.warehouse?.code ?? inv.warehouseCode ?? null,
  }
}

/**
 * تبدیل یک رکورد محصول به فرم استاندارد خروجی API
 */
export function serializeStone<T extends AnyRecord>(stone: T) {
  if (!stone) return stone
  return {
    ...stone,
    inventory: flattenInventory(stone.inventory),
  }
}

/**
 * نگاشت لیستی از محصولات
 */
export function serializeStones<T extends AnyRecord>(stones: readonly T[]) {
  return stones.map((stone) => serializeStone(stone))
}

/**
 * خواندن امنِ موجودی در سمت کلاینت
 *
 * داده‌های قدیمی (کش‌شده یا ذخیره‌شده) ممکن است هنوز آرایه باشند،
 * بنابراین این تابع هر دو شکل را پشتیبانی می‌کند.
 */
export function getInventory(stone: unknown): AnyRecord | null {
  if (!stone || typeof stone !== 'object') return null
  return flattenInventory((stone as AnyRecord).inventory)
}

/**
 * خواندن امنِ یک عدد از موجودی
 */
export function getInventoryNumber(
  stone: unknown,
  key: 'slabCount' | 'totalSqm' | 'availableSqm' | 'reservedSqm' | 'inProductionSqm' | 'blockCount'
): number {
  const value = Number(getInventory(stone)?.[key] ?? 0)
  return Number.isFinite(value) ? value : 0
}
