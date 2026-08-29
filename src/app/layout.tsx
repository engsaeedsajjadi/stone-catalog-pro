import type { Metadata } from 'next'

import './globals.css'

import { getSiteConfig } from '@/lib/site-config'
import { AppShell } from '@/components/public/app-shell'

export const dynamic = 'force-dynamic'

/**
 * متادیتا از تنظیمات سایت (بخش SEO و برند) و به‌صورت سمت‌سرور تولید می‌شود
 * تا موتورهای جستجو و شبکه‌های اجتماعی هنگام اشتراک‌گذاری لینک آن را ببینند.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await getSiteConfig()

    const title =
      config.seo.title ||
      config.brand.nameFa ||
      config.brand.nameEn ||
      'Digital Catalog'

    const description =
      config.seo.description ||
      config.brand.taglineFa ||
      config.brand.taglineEn ||
      ''

    const base = process.env.NEXT_PUBLIC_APP_URL
    const icon = config.brand.faviconUrl || config.brand.logoUrl || undefined

    const keywords = (config.seo.keywords || '')
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    return {
      title: { default: title, template: `%s | ${title}` },
      description,
      keywords: keywords.length > 0 ? keywords : undefined,
      metadataBase: base ? new URL(base) : undefined,
      alternates: {
        canonical: config.seo.canonical || base || undefined,
      },
      icons: icon ? { icon, apple: icon } : undefined,
      openGraph: {
        type: 'website',
        title,
        description,
        siteName: title,
        locale: 'fa_IR',
        images: config.seo.ogImage ? [{ url: config.seo.ogImage }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        site: config.seo.twitterHandle || undefined,
        images: config.seo.ogImage ? [config.seo.ogImage] : undefined,
      },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: 'Digital Catalog', robots: { index: true, follow: true } }
  }
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
