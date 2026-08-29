import { getDefaultHomeBlocks } from "@/lib/site-blocks";

import type {
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
} from "@/lib/site-config-types";

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
};

/* =========================================================
 * Default Pages
 * ======================================================= */

export const DEFAULT_PAGE = (
  slug: string,
  title: string,
  blocks: SiteBlock[] = []
): SitePage => ({
  slug,
  title,
  published: true,
  blocks,
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
    home: DEFAULT_PAGE("home", "صفحه اصلی", getDefaultHomeBlocks() as SiteBlock[]),
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

export function mergeConfig(
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
