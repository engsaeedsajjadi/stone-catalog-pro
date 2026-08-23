'use client'

import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { useSiteConfig } from '@/components/public/site-runtime'

export function AboutPage() {
  const site = useSiteConfig()
  const page = site.pages.about
  const blocks = (page?.blocks || []).filter(block => block.enabled)

  return (
    <div className="min-h-screen">
      <section
        className="py-20 text-white"
        style={{ background: 'linear-gradient(135deg,var(--site-secondary),var(--site-primary))' }}
      >
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-5">
            {page?.title || site.brand.nameFa || site.brand.nameEn || ''}
          </h1>

          <p className="text-lg text-white/80">
            {site.brand.taglineFa || site.brand.taglineEn || ''}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-8">
        {blocks.map(block => (
          <Card key={block.id} className="p-8">
            <h2 className="text-2xl font-bold mb-4">{block.title}</h2>

            <p className="leading-8 whitespace-pre-wrap text-muted-foreground">
              {String(block.data?.body || '')}
            </p>

            {block.imageUrl && (
              <img
                src={block.imageUrl}
                alt={block.title || ''}
                className="mt-6 rounded-2xl w-full max-h-[520px] object-cover"
              />
            )}
          </Card>
        ))}

        {blocks.length === 0 && (
          <Card className="p-10 text-center border-dashed">
            <p className="text-muted-foreground">
              این صفحه هنوز توسط مدیر سایت تکمیل نشده است.
            </p>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="bg-primary text-primary-foreground px-5 py-3 rounded-lg"
          >
            تماس با ما
          </Link>

          <Link href="/catalog" className="border px-5 py-3 rounded-lg">
            مشاهده کاتالوگ
          </Link>
        </div>
      </div>
    </div>
  )
}
