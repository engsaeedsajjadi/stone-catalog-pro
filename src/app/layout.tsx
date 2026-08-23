import type { Metadata } from 'next'
import './globals.css'
import { getSiteConfig } from '@/lib/site-config'
import { AppShell } from '@/components/public/app-shell'
export const dynamic = 'force-dynamic'
export async function generateMetadata(): Promise<Metadata> {
  try { const c=await getSiteConfig(); const title=c.seo.title||c.brand.nameFa||c.brand.nameEn||'Digital Catalog'; const description=c.seo.description||c.brand.taglineFa||c.brand.taglineEn||''; const base=process.env.NEXT_PUBLIC_APP_URL; return {title:{default:title,template:`%s | ${title}`},description,metadataBase:base?new URL(base):undefined,openGraph:{type:'website',title,description,siteName:title,images:c.seo.ogImage?[c.seo.ogImage]:undefined},twitter:{card:'summary_large_image',title,description},robots:{index:true,follow:true}} } catch { return { title:'Digital Catalog', robots:{index:true,follow:true} } }
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fa" dir="rtl"><body><AppShell>{children}</AppShell></body></html> }
