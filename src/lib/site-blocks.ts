import {
  Award,
  Clock,
  Factory,
  Gem,
  Globe2,
  Headset,
  Layers,
  Package,
  Recycle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * قرارداد داده‌ی بلوک‌های صفحه‌ساز
 *
 * این فایل تنها مرجعِ تعریفِ ساختار داده است و هم در «طراح سایت»
 * (ویرایشگر) و هم در رندرر عمومی استفاده می‌شود تا هر دو همیشه
 * بر سر یک شکلِ داده توافق داشته باشند.
 */

export type HeroSlide = {
  id?: string
  image?: string
  badge?: string
  title?: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
}

export type FeatureItem = {
  id?: string
  icon?: string
  title?: string
  desc?: string
}

export type StatItem = {
  id?: string
  label?: string
  value?: string
  sub?: string
}

export type TestimonialItem = {
  id?: string
  name?: string
  role?: string
  quote?: string
  rating?: number
}

export type ProductSource = 'featured' | 'newest' | 'bestseller' | 'export' | 'latest'

export type HeroData = {
  slides?: HeroSlide[]
  showSearch?: boolean
  height?: 'full' | 'large' | 'medium'
  intervalMs?: number
}

export type ProductsData = {
  source?: ProductSource
  limit?: number
  alt?: boolean
}

export type CategoriesData = {
  limit?: number
  displayType?: 'grid' | 'list' | 'carousel'
  showImages?: boolean
}

export type FeaturesData = {
  items?: FeatureItem[]
  columns?: 2 | 3 | 4
}

export type StatsData = {
  items?: StatItem[]
}

export type TestimonialsData = {
  items?: TestimonialItem[]
}

export type GalleryData = {
  images?: string[]
  imageMediaIds?: string[]
  columns?: 2 | 3 | 4
}

export type CtaData = {
  title?: string
  subtitle?: string
  body?: string
  buttonText?: string
  buttonHref?: string
  backgroundImage?: string
  align?: 'center' | 'start'
}

export type RichTextData = {
  body?: string
  align?: 'center' | 'start'
  background?: 'none' | 'muted' | 'dark'
}

export type ImageTextData = {
  body?: string
  images?: string[]
  imageMediaIds?: string[]
  reverse?: boolean
  ctaText?: string
  ctaHref?: string
}

export type ContactData = {
  title?: string
  subtitle?: string
  body?: string
  showForm?: boolean
}

export type SpacerData = {
  height?: number
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export const FEATURE_ICON_NAMES = [
  'TrendingUp',
  'ShieldCheck',
  'Truck',
  'Award',
  'Sparkles',
  'Globe2',
  'Factory',
  'Users',
  'Package',
  'Layers',
  'Clock',
  'Headset',
  'Gem',
  'Recycle',
] as const

export const FEATURE_ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  ShieldCheck,
  Truck,
  Award,
  Sparkles,
  Globe2,
  Factory,
  Users,
  Package,
  Layers,
  Clock,
  Headset,
  Gem,
  Recycle,
}

export const FEATURE_ICON_LABELS: Record<string, string> = {
  TrendingUp: 'رشد / قیمت',
  ShieldCheck: 'تضمین کیفیت',
  Truck: 'ارسال و تحویل',
  Award: 'تجربه و افتخارات',
  Sparkles: 'ویژه و لوکس',
  Globe2: 'صادرات',
  Factory: 'کارخانه',
  Users: 'مشتریان',
  Package: 'محصولات',
  Layers: 'تنوع',
  Clock: 'زمان',
  Headset: 'پشتیبانی',
  Gem: 'ارزش',
  Recycle: 'پایداری',
}

export function getFeatureIcon(name?: string): LucideIcon {
  if (!name) return Star
  return FEATURE_ICONS[name] || Star
}

/** تبدیل ایمنِ هر مقداری به آرایه‌ای از رشته‌ها */
export function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

/** تبدیل ایمنِ هر مقداری به آرایه‌ای از اشیاء */
export function toRecordArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter((item) => item && typeof item === 'object') as T[]) : []
}

/** تولید شناسه‌ی کوتاه برای آیتم‌های جدید */
export function createItemId(prefix = 'item') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

/**
 * بلوک‌های پیش‌فرض صفحه اصلی
 *
 * هیچ محتوای تجاری نمونه‌ای seed نمی‌شود؛ متن‌ها از برند/شعار
 * خوانده می‌شوند و مدیر سایت آن‌ها را ویرایش می‌کند.
 */
export function getDefaultHomeBlocks() {
  return [
    {
      id: 'home-hero',
      type: 'hero',
      enabled: true,
      order: 0,
      title: '',
      subtitle: '',
      data: {
        slides: [],
        showSearch: true,
        height: 'full',
        intervalMs: 6000,
      },
    },
    {
      id: 'home-categories',
      type: 'categories',
      enabled: true,
      order: 1,
      title: 'دسته‌بندی سنگ‌ها',
      subtitle: '',
      data: {
        limit: 8,
        displayType: 'grid',
        showImages: true,
      },
    },
    {
      id: 'home-featured',
      type: 'products',
      enabled: true,
      order: 2,
      title: 'محصولات ویژه',
      subtitle: 'منتخب کاتالوگ',
      data: {
        source: 'featured',
        limit: 8,
        alt: false,
      },
    },
    {
      id: 'home-newest',
      type: 'products',
      enabled: true,
      order: 3,
      title: 'جدیدترین سنگ‌ها',
      subtitle: 'تازه‌های کاتالوگ',
      data: {
        source: 'newest',
        limit: 8,
        alt: true,
      },
    },
    {
      id: 'home-cta',
      type: 'cta',
      enabled: true,
      order: 4,
      title: 'سنگ مناسب پروژه شما',
      subtitle: 'کاتالوگ کامل را مرور کنید یا با کارشناسان ما تماس بگیرید.',
      data: {
        buttonText: 'مشاهده کاتالوگ',
        buttonHref: '/catalog',
        align: 'center',
      },
    },
  ]
}
