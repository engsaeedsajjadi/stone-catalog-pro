import { db } from "@/lib/db";

import {
  DEFAULT_SITE_CONFIG,
  mergeConfig as mergeSiteConfigInternal,
  type SiteConfig,
} from "@/lib/site-config-defaults";

export type {
  SiteBlock,
  SiteBlockData,
  SiteBlockType,
  SitePage,
  SiteNavItem,
  SiteBrand,
  SiteSeo,
  SiteContact,
  SiteSocial,
  SiteAppearance,
  SiteTheme,
  SiteFooter,
  SiteConfig,
} from "@/lib/site-config-defaults";

export { DEFAULT_SITE_CONFIG };

/** ادغام تنظیمات ذخیره‌شده با پیش‌فرض‌ها (بدون نیاز به پایگاه‌داده) */
export function mergeSiteConfig(
  defaults: typeof DEFAULT_SITE_CONFIG,
  saved: Partial<typeof DEFAULT_SITE_CONFIG>
) {
  return mergeSiteConfigInternal(defaults, saved);
}

/* =========================================================
 * Read Site Config
 * ======================================================= */

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    // استفاده ایمن از SiteConfig — مدل باید در schema.prisma وجود داشته باشد
    type SiteConfigDelegate = {
      findFirst: () => Promise<{ id: string; config: unknown } | null>
      create: (args: { data: { config: unknown } }) => Promise<{ id: string; config: unknown }>
      update: (args: { where: { id: string }; data: { config: unknown } }) => Promise<{ id: string; config: unknown }>
    }

    const siteConfigModel = ('siteConfig' in db)
      ? (db as unknown as Record<string, SiteConfigDelegate>).siteConfig
      : undefined

    if (!siteConfigModel) {
      return DEFAULT_SITE_CONFIG
    }

    const record = await siteConfigModel.findFirst()

    if (!record) {
      return DEFAULT_SITE_CONFIG;
    }

    let saved: Partial<SiteConfig> = {};

    if (typeof record.config === "string") {
      try {
        saved = JSON.parse(record.config);
      } catch {
        saved = {};
      }
    } else if (
      record.config &&
      typeof record.config === "object"
    ) {
      saved = record.config as Partial<SiteConfig>;
    } else {
      saved = {}
    }

    return mergeSiteConfigInternal(
      DEFAULT_SITE_CONFIG,
      saved
    );
  } catch (error) {
    console.error(
      "Failed to load site configuration:",
      error
    );

    return DEFAULT_SITE_CONFIG;
  }
}

/* =========================================================
 * Save Site Config
 * ======================================================= */

export async function saveSiteConfig(
  config: SiteConfig
): Promise<SiteConfig> {
  type SiteConfigDelegate = {
    findFirst: () => Promise<{ id: string; config: unknown } | null>
    create: (args: { data: { config: unknown } }) => Promise<{ id: string; config: unknown }>
    update: (args: { where: { id: string }; data: { config: unknown } }) => Promise<{ id: string; config: unknown }>
  }

  const siteConfigModel = ('siteConfig' in db)
    ? (db as unknown as Record<string, SiteConfigDelegate>).siteConfig
    : undefined

  if (!siteConfigModel) {
    throw new Error(
      "مدل SiteConfig در Prisma وجود ندارد. مدل SiteConfig را در schema.prisma بررسی کنید."
    )
  }

  const normalized = mergeSiteConfigInternal(
    DEFAULT_SITE_CONFIG,
    config
  );

  const existing =
    await siteConfigModel.findFirst();

  if (existing) {
    const updated =
      await siteConfigModel.update({
        where: {
          id: existing.id,
        },

        data: {
          config: normalized,
        },
      });

    return extractConfigFromRecord(
      updated,
      normalized
    );
  }

  const created =
    await siteConfigModel.create({
      data: {
        config: normalized,
      },
    });

  return extractConfigFromRecord(
    created,
    normalized
  );
}

/* =========================================================
 * Extract Config
 * ======================================================= */

function extractConfigFromRecord(
  record: any,
  fallback: SiteConfig
): SiteConfig {
  if (record?.config) {
    if (typeof record.config === "string") {
      try {
        return mergeSiteConfigInternal(
          DEFAULT_SITE_CONFIG,
          JSON.parse(record.config)
        );
      } catch {
        return fallback;
      }
    }

    if (
      typeof record.config === "object"
    ) {
      return mergeSiteConfigInternal(
        DEFAULT_SITE_CONFIG,
        record.config as Partial<SiteConfig>
      );
    }
  }

  return fallback;
}