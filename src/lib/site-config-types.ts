/**
 * تایپ‌های تنظیمات سایت
 *
 * این فایل «تنها منبع حقیقت» برای ساختار داده‌ی تنظیمات است و هم در
 * طراح سایت (پنل مدیریت) و هم در بخش عمومی سایت استفاده می‌شود.
 *
 * علت یکپارچه‌سازی: قبلاً دو تعریفِ موازی وجود داشت و فیلدی که در پنل
 * ذخیره می‌شد ممکن بود در سایت اصلاً شناخته‌شده نباشد (مثلاً شبکه‌های
 * اجتماعی). حالا هر دو سمت یک قرارداد را می‌بینند.
 *
 * ایندکس‌سیگنچرها ([key: string]: any) عمداً گذاشته شده‌اند تا فیلدهای
 * جدیدی که در آینده به طراح اضافه می‌شوند باعث شکستن تایپ‌ها نشوند.
 */

export type SiteTheme = {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  radius: string
  font: string
  cardStyle: 'flat' | 'soft' | 'bordered' | string
  buttonStyle: 'rounded' | 'pill' | 'square' | string

  [key: string]: any
}

export type SiteBrand = {
  nameFa?: string
  nameEn?: string
  taglineFa?: string
  taglineEn?: string

  /** نام‌های قدیمیِ فیلد لوگو (برای سازگاری با داده‌های قبلی) */
  logo?: string
  favicon?: string

  logoMediaId?: string
  logoUrl?: string
  faviconMediaId?: string
  faviconUrl?: string

  description?: string

  phone?: string
  email?: string
  whatsapp?: string

  address?: string
  country?: string
  city?: string

  instagram?: string
  telegram?: string
  youtube?: string
  linkedin?: string
  facebook?: string

  mapUrl?: string
  workingHours?: string

  [key: string]: any
}

export type SiteBlockType =
  | 'hero'
  | 'richtext'
  | 'image-text'
  | 'products'
  | 'categories'
  | 'features'
  | 'stats'
  | 'gallery'
  | 'testimonials'
  | 'cta'
  | 'contact'
  | 'spacer'
  | string

export type SiteBlockData = Record<string, unknown>

export type SiteBlock = {
  id: string
  type: SiteBlockType
  enabled: boolean
  title?: string
  subtitle?: string
  imageUrl?: string
  data: SiteBlockData
  order: number

  [key: string]: any
}

export type SitePage = {
  slug: string
  title: string
  description?: string
  published: boolean
  blocks: SiteBlock[]

  [key: string]: any
}

export type SiteNavItem = {
  id?: string
  label: string
  href: string
  enabled: boolean
  order: number

  [key: string]: any
}

export type SiteSeo = {
  title?: string
  description?: string
  keywords?: string

  og?: string
  ogImage?: string

  canonical?: string
  twitterHandle?: string

  [key: string]: any
}

export type SiteContact = {
  phone?: string
  email?: string
  whatsapp?: string

  country?: string
  city?: string
  address?: string

  workingHours?: string

  mapUrl?: string

  [key: string]: any
}

export type SiteSocial = {
  instagram?: string
  telegram?: string
  whatsapp?: string
  linkedin?: string
  facebook?: string
  youtube?: string

  [key: string]: any
}

export type SiteAppearance = {
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  darkMode?: boolean

  [key: string]: any
}

export type SiteFooterLink = {
  label: string
  href: string
  enabled: boolean
}

export type SiteFooter = {
  text?: string
  copyright?: string
  links?: SiteFooterLink[]

  [key: string]: any
}

export type SiteConfig = {
  brand: SiteBrand

  theme: SiteTheme

  nav: SiteNavItem[]

  contact?: SiteContact

  social?: SiteSocial

  appearance?: SiteAppearance

  footer: SiteFooter

  seo: SiteSeo

  pages: Record<string, SitePage>

  features?: Record<string, boolean>

  blocks?: SiteBlock[]

  [key: string]: any
}

/**
 * مقدار اولیه — تا زمانی که پاسخ سرور برسد استفاده می‌شود
 */
export const emptySiteConfig: SiteConfig = {
  brand: {},
  // هم‌تراز با DEFAULT_SITE_CONFIG تا هنگام بارگذاری تنظیمات،
  // پرش رنگ/ظاهر دیده نشود
  theme: {
    primary: '#111827',
    secondary: '#374151',
    accent: '#d4a72c',
    background: '#ffffff',
    foreground: '#111827',
    muted: '#f3f4f6',
    radius: '0.75rem',
    font: 'Vazirmatn',
    cardStyle: 'soft',
    buttonStyle: 'rounded',
  },
  nav: [],
  footer: {
    links: [],
  },
  seo: {},
  pages: {},
  features: {},
}
