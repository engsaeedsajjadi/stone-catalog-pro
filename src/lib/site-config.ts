import { db } from "@/lib/db";

/* =========================================================
 * Site Block
 * ======================================================= */

export type SiteBlockType =
  | "hero"
  | "richtext"
  | "image-text"
  | "products"
  | "categories"
  | "features"
  | "stats"
  | "gallery"
  | "testimonials"
  | "cta"
  | "contact"
  | "spacer"
  | string;

export type SiteBlockData = Record<string, any>;

export type SiteBlock = {
  id?: string;
  type: SiteBlockType;

  enabled?: boolean;
  order: number;

  title?: string;
  subtitle?: string;
  description?: string;

  image?: string;
  imageUrl?: string;

  href?: string;
  buttonText?: string;
  content?: string;

  /**
   * محتوای اختصاصی هر نوع Block
   */
  data?: SiteBlockData;

  [key: string]: any;
};

/* =========================================================
 * Page
 * ======================================================= */

export type SitePage = {
  slug: string;
  title: string;
  published?: boolean;
  blocks: SiteBlock[];
  [key: string]: any;
};

/* =========================================================
 * Navigation
 * ======================================================= */

export type SiteNavItem = {
  id?: string;
  label: string;
  href: string;
  enabled: boolean;
  order: number;
  [key: string]: any;
};

/* =========================================================
 * Brand
 * ======================================================= */

export type SiteBrand = {
  nameFa: string;
  nameEn: string;

  taglineFa?: string;
  taglineEn?: string;

  logo?: string;
  favicon?: string;

  logoUrl?: string;
  logoMediaId?: string;

  description?: string;

  phone?: string;
  email?: string;
  whatsapp?: string;

  city?: string;
  country?: string;
  address?: string;

  workingHours?: string;

  instagram?: string;
  telegram?: string;
  youtube?: string;
  linkedin?: string;
  facebook?: string;

  mapUrl?: string;

  [key: string]: any;
};

/* =========================================================
 * SEO
 * ======================================================= */

export type SiteSeo = {
  title: string;
  description: string;

  keywords?: string;

  ogImage?: string;

  canonical?: string;
  twitterHandle?: string;

  [key: string]: any;
};

/* =========================================================
 * Contact
 * ======================================================= */

export type SiteContact = {
  phone?: string;
  email?: string;
  whatsapp?: string;

  country?: string;
  city?: string;
  address?: string;

  workingHours?: string;

  mapUrl?: string;

  [key: string]: any;
};

/* =========================================================
 * Social
 * ======================================================= */

export type SiteSocial = {
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;

  [key: string]: any;
};

/* =========================================================
 * Appearance
 * ======================================================= */

export type SiteAppearance = {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  darkMode?: boolean;

  [key: string]: any;
};

/* =========================================================
 * Theme
 * ======================================================= */

export type SiteTheme = {
  primary?: string;
  secondary?: string;
  accent?: string;

  background?: string;
  foreground?: string;
  muted?: string;

  radius?: string;

  font?: string;

  cardStyle?: "soft" | "flat" | "bordered" | string;

  buttonStyle?: "rounded" | "pill" | "square" | string;

  [key: string]: any;
};

/* =========================================================
 * Footer
 * ======================================================= */

export type SiteFooter = {
  text?: string;
  copyright?: string;

  [key: string]: any;
};

/* =========================================================
 * Main Site Config
 * ======================================================= */

export type SiteConfig = {
  brand: SiteBrand;

  seo: SiteSeo;

  contact: SiteContact;

  social: SiteSocial;

  appearance: SiteAppearance;

  theme: SiteTheme;

  nav: SiteNavItem[];

  pages: Record<string, SitePage>;

  footer: SiteFooter;

  blocks: SiteBlock[];

  [key: string]: any;
};

/* =========================================================
 * Default Pages
 * ======================================================= */

const DEFAULT_PAGE = (
  slug: string,
  title: string
): SitePage => ({
  slug,
  title,
  published: true,
  blocks: [],
});

/* =========================================================
 * Default Site Config
 * ======================================================= */

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brand: {
    nameFa: "کاتالوگ سنگ",
    nameEn: "Stone Catalog",

    taglineFa: "",
    taglineEn: "",

    logo: "",
    favicon: "",

    logoUrl: "",
    logoMediaId: "",

    description: "کاتالوگ دیجیتال محصولات سنگ",

    phone: "",
    email: "",
    whatsapp: "",

    city: "",
    country: "",
    address: "",

    workingHours: "",

    instagram: "",
    telegram: "",
    youtube: "",
    linkedin: "",
    facebook: "",

    mapUrl: "",
  },

  seo: {
    title: "کاتالوگ دیجیتال سنگ",
    description: "مشاهده و بررسی محصولات سنگ",

    keywords: "",

    ogImage: "",

    canonical: "",
    twitterHandle: "",
  },

  contact: {
    phone: "",
    email: "",
    whatsapp: "",

    country: "",
    city: "",
    address: "",

    workingHours: "",

    mapUrl: "",
  },

  social: {
    instagram: "",
    telegram: "",
    whatsapp: "",
    linkedin: "",
    facebook: "",
    youtube: "",
  },

  appearance: {
    primaryColor: "#111827",
    secondaryColor: "#6b7280",
    fontFamily: "Vazirmatn",
    darkMode: false,
  },

  theme: {
    primary: "#111827",
    secondary: "#374151",
    accent: "#d4a72c",

    background: "#ffffff",
    foreground: "#111827",
    muted: "#f3f4f6",

    radius: "0.75rem",

    font: "Vazirmatn",

    cardStyle: "soft",
    buttonStyle: "rounded",
  },

  nav: [
    {
      id: "nav-home",
      label: "صفحه اصلی",
      href: "/",
      enabled: true,
      order: 0,
    },
    {
      id: "nav-catalog",
      label: "کاتالوگ سنگ",
      href: "/catalog",
      enabled: true,
      order: 1,
    },
    {
      id: "nav-about",
      label: "درباره ما",
      href: "/about",
      enabled: true,
      order: 2,
    },
    {
      id: "nav-contact",
      label: "تماس با ما",
      href: "/contact",
      enabled: true,
      order: 3,
    },
  ],

  pages: {
    home: DEFAULT_PAGE("home", "صفحه اصلی"),
    about: DEFAULT_PAGE("about", "درباره ما"),
    contact: DEFAULT_PAGE("contact", "تماس با ما"),
  },

  footer: {
    text: "",
    copyright: "",
  },

  blocks: [],
};

/* =========================================================
 * Deep Merge
 * ======================================================= */

function mergeConfig(
  defaults: SiteConfig,
  saved: Partial<SiteConfig>
): SiteConfig {
  const savedPages =
    saved.pages && typeof saved.pages === "object"
      ? saved.pages
      : {};

  const mergedPages: Record<string, SitePage> = {
    ...defaults.pages,
  };

  for (const [slug, page] of Object.entries(savedPages)) {
    if (!page || typeof page !== "object") {
      continue;
    }

    const defaultPage =
      defaults.pages[slug] ||
      DEFAULT_PAGE(
        slug,
        (page as any).title || slug
      );

    mergedPages[slug] = {
      ...defaultPage,
      ...(page as SitePage),

      blocks: Array.isArray((page as SitePage).blocks)
        ? (page as SitePage).blocks
        : defaultPage.blocks,
    };
  }

  return {
    ...defaults,
    ...saved,

    brand: {
      ...defaults.brand,
      ...(saved.brand || {}),
    },

    seo: {
      ...defaults.seo,
      ...(saved.seo || {}),
    },

    contact: {
      ...defaults.contact,
      ...(saved.contact || {}),
    },

    social: {
      ...defaults.social,
      ...(saved.social || {}),
    },

    appearance: {
      ...defaults.appearance,
      ...(saved.appearance || {}),
    },

    theme: {
      ...defaults.theme,
      ...(saved.theme || {}),
    },

    footer: {
      ...defaults.footer,
      ...(saved.footer || {}),
    },

    nav: Array.isArray(saved.nav)
      ? saved.nav
      : defaults.nav,

    pages: mergedPages,

    blocks: Array.isArray(saved.blocks)
      ? saved.blocks
      : defaults.blocks,
  };
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

    const siteConfigModel = (db as Record<string, unknown>).siteConfig as SiteConfigDelegate | undefined

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

    return mergeConfig(
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

  const siteConfigModel = (db as Record<string, unknown>).siteConfig as SiteConfigDelegate | undefined

  if (!siteConfigModel) {
    throw new Error(
      "مدل SiteConfig در Prisma وجود ندارد. مدل SiteConfig را در schema.prisma بررسی کنید."
    )
  }

  const normalized = mergeConfig(
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
        return mergeConfig(
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
      return mergeConfig(
        DEFAULT_SITE_CONFIG,
        record.config as Partial<SiteConfig>
      );
    }
  }

  return fallback;
}