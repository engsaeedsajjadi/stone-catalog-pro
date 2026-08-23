import { db } from '@/lib/db'
import { PERMISSIONS, type Permission } from '@/lib/permissions'

/**
 * بررسی دسترسی کاربر بر اساس نقش و سیستم Permission
 *
 * ابتدا نقش کاربر بررسی می‌شود (backward-compatible)
 * سپس دسترسی‌های granular از جدول RolePermission بررسی می‌شوند
 */
export async function hasPermission(
  userId: string,
  userRole: string,
  permission: Permission
): Promise<boolean> {
  // ADMIN همیشه دسترسی کامل دارد
  if (userRole === 'ADMIN') return true

  // بررسی از جدول RolePermission
  try {
    const permRecord = await db.permission.findUnique({
      where: { key: permission },
      include: { roles: true },
    })

    if (!permRecord) return false

    return permRecord.roles.some((rp) => rp.role === userRole)
  } catch {
    // اگر جدول Permission وجود نداشت، fallback به نقش‌ها
    return false
  }
}

/**
 * بررسی چندین دسترسی (همه باید داشته باشند)
 */
export async function hasAllPermissions(
  userId: string,
  userRole: string,
  permissions: Permission[]
): Promise<boolean> {
  if (userRole === 'ADMIN') return true

  const results = await Promise.all(
    permissions.map((p) => hasPermission(userId, userRole, p))
  )

  return results.every(Boolean)
}

/**
 * بررسی حداقل یکی از دسترسی‌ها
 */
export async function hasAnyPermission(
  userId: string,
  userRole: string,
  permissions: Permission[]
): Promise<boolean> {
  if (userRole === 'ADMIN') return true

  const results = await Promise.all(
    permissions.map((p) => hasPermission(userId, userRole, p))
  )

  return results.some(Boolean)
}

/**
 * نقشه‌ای از نقش‌ها به دسترسی‌های پیش‌فرض
 * در صورتی که جدول RolePreference خالی باشد
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  SALES_MANAGER: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.PRICING_READ,
    PERMISSIONS.PRICING_UPDATE,
    PERMISSIONS.REPORTS_READ,
  ],
  OPERATOR: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.PRICING_READ,
  ],
}
