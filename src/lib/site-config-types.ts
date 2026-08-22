export type SiteTheme = {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  radius: string
  font: string
  cardStyle: 'flat' | 'soft' | 'bordered'
  buttonStyle: 'rounded' | 'pill' | 'square'
}

export type SiteBrand = {
  nameFa?: string
  nameEn?: string
  taglineFa?: string
  taglineEn?: string
  logoMediaId?: string
  logoUrl?: string
  faviconMediaId?: string
  faviconUrl?: string
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
  mapUrl?: string
  workingHours?: string
}

export type SiteBlock = {
  id: string
  type:
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
  enabled: boolean
  title?: string
  subtitle?: string
  imageUrl?: string
  data: Record<string, unknown>
  order: number
}

export type SitePage = {
  slug: string
  title: string
  description?: string
  published: boolean
  blocks: SiteBlock[]
}

export type SiteConfig = {
  brand: SiteBrand
  theme: SiteTheme
  nav: Array<{
    label: string
    href: string
    enabled: boolean
    order: number
  }>
  footer: {
    text?: string
    links: Array<{
      label: string
      href: string
      enabled: boolean
    }>
  }
  seo: {
    title?: string
    description?: string
    keywords?: string
    ogImage?: string
    twitterHandle?: string
    canonical?: string
  }
  pages: Record<string, SitePage>
  features: Record<string, boolean>
}

export const emptySiteConfig: SiteConfig = {
  brand: {},
  theme: {
    primary: '#1f2937',
    secondary: '#111827',
    accent: '#d4af37',
    background: '#ffffff',
    foreground: '#111827',
    muted: '#f3f4f6',
    radius: '16px',
    font: 'system-ui',
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