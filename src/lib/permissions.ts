export const PERMISSIONS = {
  PRODUCTS_READ: "products.read",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  CATEGORIES_READ: "categories.read",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_UPDATE: "categories.update",
  CATEGORIES_DELETE: "categories.delete",

  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",

  ORDERS_READ: "orders.read",
  ORDERS_CREATE: "orders.create",
  ORDERS_UPDATE: "orders.update",
  ORDERS_DELETE: "orders.delete",

  INVENTORY_READ: "inventory.read",
  INVENTORY_UPDATE: "inventory.update",

  PRICING_READ: "pricing.read",
  PRICING_UPDATE: "pricing.update",

  SETTINGS_READ: "settings.read",
  SETTINGS_UPDATE: "settings.update",

  SITE_CONFIG_READ: "site-config.read",
  SITE_CONFIG_UPDATE: "site-config.update",

  REPORTS_READ: "reports.read",

  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * دسترسی‌های پیش‌فرض
 *
 * برای bootstrap-permissions استفاده می‌شود.
 * تمام Permissionهای تعریف‌شده را در اختیار سیستم قرار می‌دهد.
 */
export const DEFAULT_PERMISSIONS = [...ALL_PERMISSIONS] as Permission[];