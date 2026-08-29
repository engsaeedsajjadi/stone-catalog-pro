'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Layers,
  Mail,
  MapPin,
  Phone,
  Quote,
  Search,
  Star,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

import { useAppStore } from '@/store/app-store'
import { useSiteConfig } from '@/components/public/site-runtime'
import { ProductCard } from '@/components/stone/product-card'
import type { SiteBlock } from '@/lib/site-config-types'
import {
  getFeatureIcon,
  normalizeNumber,
  toRecordArray,
  toStringArray,
  type FeatureItem,
  type HeroSlide,
  type ProductSource,
  type StatItem,
  type TestimonialItem,
} from '@/lib/site-blocks'

/* -------------------------------------------------------------------------- */
/* Data hooks                                                                  */
/* -------------------------------------------------------------------------- */

type AnyRecord = Record<string, any>

function useProducts(source: ProductSource, limit: number) {
  const [stones, setStones] = useState<AnyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const params = new URLSearchParams()
    if (source === 'featured') params.set('featured', 'true')
    if (source === 'newest') params.set('newest', 'true')
    if (source === 'bestseller') params.set('bestseller', 'true')
    if (source === 'export') params.set('export', 'true')
    params.set('pageSize', String(Math.min(Math.max(limit, 1), 24)))

    ;(async () => {
      try {
        const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setStones(data.data || [])
      } catch {
        if (!cancelled) setStones([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [source, limit])

  return { stones, loading }
}

function useCategories(limit: number) {
  const [categories, setCategories] = useState<AnyRecord[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setCategories((data.data || []).slice(0, Math.max(limit, 1)))
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [limit])

  return categories
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

const GOLD = '#d6b66a'
const DARK = '#12110f'
const LIGHT = '#f4f0e8'

function SectionLabel({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="mb-6 text-[10px] font-bold tracking-[.4em]" style={{ color: GOLD }}>
      {children}
    </div>
  )
}

/**
 * تبدیل href به عملِ مناسب در SPA
 */
function useBlockNavigate() {
  const navigate = useAppStore((state) => state.navigate)

  return (href?: string) => {
    if (!href) return

    if (/^https?:\/\//i.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }

    const value = href.trim()
    const routeMatch = value.match(/^\/\?route=([a-z]+)/i)

    if (routeMatch) {
      navigate(routeMatch[1])
      return
    }

    if (value === '/' || value === '') {
      navigate('home')
      return
    }

    if (value.startsWith('/catalog')) {
      navigate('catalog')
      return
    }
    if (value.startsWith('/about')) {
      navigate('about')
      return
    }
    if (value.startsWith('/contact')) {
      navigate('contact')
      return
    }

    window.location.href = value
  }
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/* HERO                                                                        */
/* -------------------------------------------------------------------------- */

function HeroBlock({ block }: { block: SiteBlock }) {
  const site = useSiteConfig()
  const navigate = useAppStore((state) => state.navigate)
  const go = useBlockNavigate()
  const reduceMotion = useReducedMotion()

  const data = (block.data || {}) as Record<string, unknown>
  const slides = toRecordArray<HeroSlide>(data.slides)
  const showSearch = data.showSearch !== false
  const height = data.height === 'medium' ? 'min-h-[520px]' : data.height === 'large' ? 'min-h-[760px]' : 'min-h-[min(920px,100svh)]'
  const intervalMs = normalizeNumber(data.intervalMs, 6000, 2000, 20000)

  const [slide, setSlide] = useState(0)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => setSlide((current) => (current + 1) % slides.length), intervalMs)
    return () => clearInterval(timer)
  }, [slides.length, intervalMs])

  const brandTitle = site.brand.nameFa || site.brand.nameEn || ''
  const brandTagline = site.brand.taglineFa || site.brand.taglineEn || ''

  const activeSlide: HeroSlide | undefined = slides[slide]

  const title = activeSlide?.title || block.title || brandTitle
  const subtitle = activeSlide?.subtitle || block.subtitle || brandTagline
  const badge = activeSlide?.badge
  const ctaText = activeSlide?.ctaText || 'مشاهده کاتالوگ'
  const ctaHref = activeSlide?.ctaHref || '/catalog'
  const backgroundImage = activeSlide?.image

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    navigate('catalog', { q: searchValue })
  }

  return (
    <section className={`relative overflow-hidden bg-[#11100f] text-white ${height}`}>
      {slides.length > 0 && (
        <div className="absolute inset-0">
          {slides.map((item, index) => (
            <motion.div
              key={item.id || index}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: slide === index ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 1.1 }}
            >
              {item.image ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${DARK} 0%, #1f1b16 55%, #2b241b 100%)`,
                  }}
                />
              )}
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,9,8,.94)_0%,rgba(10,9,8,.68)_38%,rgba(10,9,8,.2)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,9,8,.88)_0%,transparent_48%,rgba(10,9,8,.2)_100%)]" />
        </div>
      )}

      {slides.length === 0 && (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1f1b16 55%, #2b241b 100%)` }}
        />
      )}

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl items-center px-5 pb-20 pt-28 sm:px-8 lg:px-10">
        <motion.div
          key={`${slide}-${title}`}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          {badge && (
            <div className="mb-6 inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-[#dfc58b]">
              {badge}
            </div>
          )}

          <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-[-.03em] sm:text-6xl lg:text-7xl">
            {title}
          </h1>

          {subtitle && <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">{subtitle}</p>}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => go(ctaHref)}
              className="h-14 rounded-none px-8 font-bold text-[#17130d] hover:opacity-90"
              style={{ background: GOLD }}
            >
              {ctaText}
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('contact')}
              className="h-14 rounded-none border-white/30 bg-white/5 px-8 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
            >
              درخواست استعلام
            </Button>
          </div>

          {showSearch && (
            <form onSubmit={handleSearch} className="mt-10 max-w-2xl">
              <div className="flex items-center border border-white/15 bg-black/30 p-1.5 backdrop-blur-xl">
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="جستجوی سنگ، رنگ، معدن، کد..."
                  className="h-12 border-0 bg-transparent text-white placeholder:text-white/45 focus-visible:ring-0"
                />
                <Button type="submit" className="h-12 rounded-none bg-white px-6 text-[#17130d]">
                  <Search className="ml-2 h-4 w-4" />
                  جستجو
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-8 left-5 z-20 flex items-center gap-3 sm:left-10">
          <button
            type="button"
            aria-label="اسلاید قبلی"
            onClick={() => setSlide((current) => (current - 1 + slides.length) % slides.length)}
            className="flex h-10 w-10 items-center justify-center border border-white/25 text-white/70 transition hover:border-white/60 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="اسلاید بعدی"
            onClick={() => setSlide((current) => (current + 1) % slides.length)}
            className="flex h-10 w-10 items-center justify-center border border-white/25 text-white/70 transition hover:border-white/60 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            {slides.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                aria-label={`اسلاید ${index + 1}`}
                onClick={() => setSlide(index)}
                className="h-1.5 w-8 transition"
                style={{ background: slide === index ? GOLD : 'rgba(255,255,255,.25)' }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* PRODUCTS                                                                    */
/* -------------------------------------------------------------------------- */

function ProductsBlock({ block }: { block: SiteBlock }) {
  const navigate = useAppStore((state) => state.navigate)
  const data = (block.data || {}) as Record<string, unknown>
  const source = (typeof data.source === 'string' ? data.source : 'featured') as ProductSource
  const limit = normalizeNumber(data.limit, 8, 1, 24)
  const alt = Boolean(data.alt)

  const { stones, loading } = useProducts(source, limit)

  if (stones.length === 0 && !loading) return null

  return (
    <section
      className="py-20 sm:py-24"
      style={{ background: alt ? DARK : LIGHT, color: alt ? '#fff' : undefined }}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel>{block.subtitle}</SectionLabel>
              <h2 className="text-3xl font-black sm:text-4xl">{block.title}</h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('catalog', source === 'latest' ? {} : { [source]: 'true' })}
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: alt ? GOLD : '#8a6d2f' }}
            >
              مشاهده همه
            </button>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: Math.min(limit, 4) }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-black/10" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stones.map((stone, index) => (
              <Reveal key={stone.id} delay={index * 0.05}>
                <ProductCard stone={stone} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* CATEGORIES                                                                  */
/* -------------------------------------------------------------------------- */

function CategoriesBlock({ block }: { block: SiteBlock }) {
  const navigate = useAppStore((state) => state.navigate)
  const data = (block.data || {}) as Record<string, unknown>
  const limit = normalizeNumber(data.limit, 8, 1, 24)
  const showImages = data.showImages !== false
  const displayType = typeof data.displayType === 'string' ? data.displayType : 'grid'
  const categories = useCategories(limit)

  if (categories.length === 0) return null

  return (
    <section className="py-20 sm:py-24" style={{ background: LIGHT }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="mb-10">
            <SectionLabel>{block.subtitle}</SectionLabel>
            <h2 className="text-3xl font-black sm:text-4xl">{block.title}</h2>
          </div>
        </Reveal>

        {displayType === 'list' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category, index) => (
              <Reveal key={category.id} delay={index * 0.03}>
                <button
                  type="button"
                  onClick={() => navigate('catalog', { category: category.slug })}
                  className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white px-5 py-4 text-right transition hover:border-black/20"
                >
                  <span>
                    <span className="block font-bold">{category.name}</span>
                    {category._count?.stones != null && (
                      <span className="text-xs text-muted-foreground">
                        {category._count.stones} محصول
                      </span>
                    )}
                  </span>
                  <ArrowLeft className="h-4 w-4 opacity-50" />
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Reveal key={category.id} delay={index * 0.05}>
                <button
                  type="button"
                  onClick={() => navigate('catalog', { category: category.slug })}
                  className="group relative aspect-[4/5] w-full overflow-hidden text-right"
                >
                  {showImages && category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#2b241b,#12110f)' }}
                    >
                      <Layers className="h-8 w-8" style={{ color: GOLD }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 right-0 p-5 text-white">
                    <div className="text-lg font-black">{category.name}</div>
                    {category._count?.stones != null && (
                      <div className="text-xs text-white/70">{category._count.stones} محصول</div>
                    )}
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* FEATURES                                                                    */
/* -------------------------------------------------------------------------- */

function FeaturesBlock({ block }: { block: SiteBlock }) {
  const data = (block.data || {}) as Record<string, unknown>
  const items = toRecordArray<FeatureItem>(data.items)
  const columns = normalizeNumber(data.columns, 4, 2, 4)

  if (items.length === 0) return null

  return (
    <section className="py-20 sm:py-24" style={{ background: LIGHT }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="mb-12 text-center">
            <SectionLabel>{block.subtitle}</SectionLabel>
            <h2 className="text-3xl font-black sm:text-4xl">{block.title}</h2>
          </div>
        </Reveal>

        <div
          className="grid gap-6 sm:grid-cols-2"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${columns >= 4 ? 240 : 300}px, 1fr))` }}
        >
          {items.map((item, index) => {
            const Icon = getFeatureIcon(item.icon)
            return (
              <Reveal key={item.id || index} delay={index * 0.05}>
                <Card className="h-full gap-0 rounded-2xl border-black/5 bg-white p-7">
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(214,182,106,.14)', color: '#8a6d2f' }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-black">{item.title}</h3>
                  {item.desc && <p className="text-sm leading-7 text-muted-foreground">{item.desc}</p>}
                </Card>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* STATS                                                                       */
/* -------------------------------------------------------------------------- */

function StatsBlock({ block }: { block: SiteBlock }) {
  const data = (block.data || {}) as Record<string, unknown>
  const items = toRecordArray<StatItem>(data.items)

  if (items.length === 0) return null

  return (
    <section className="py-16 text-white" style={{ background: DARK }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {block.title && (
          <Reveal>
            <h2 className="mb-10 text-center text-3xl font-black">{block.title}</h2>
          </Reveal>
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <Reveal key={item.id || index} delay={index * 0.05}>
              <div className="text-center">
                <div className="text-4xl font-black" style={{ color: GOLD }}>
                  {item.value}
                </div>
                <div className="mt-2 font-bold">{item.label}</div>
                {item.sub && <div className="text-xs text-white/50">{item.sub}</div>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* TESTIMONIALS                                                                */
/* -------------------------------------------------------------------------- */

function TestimonialsBlock({ block }: { block: SiteBlock }) {
  const data = (block.data || {}) as Record<string, unknown>
  const items = toRecordArray<TestimonialItem>(data.items)

  if (items.length === 0) return null

  return (
    <section className="py-20 sm:py-24" style={{ background: LIGHT }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="mb-12 text-center">
            <SectionLabel>{block.subtitle}</SectionLabel>
            <h2 className="text-3xl font-black sm:text-4xl">{block.title}</h2>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.id || index} delay={index * 0.05}>
              <Card className="h-full gap-0 rounded-2xl border-black/5 bg-white p-7">
                <Quote className="h-7 w-7" style={{ color: GOLD }} />
                {item.quote && <p className="mt-4 leading-8 text-muted-foreground">{item.quote}</p>}

                <div className="mt-6 border-t border-black/5 pt-4">
                  <div className="font-bold">{item.name}</div>
                  {item.role && <div className="text-xs text-muted-foreground">{item.role}</div>}

                  {typeof item.rating === 'number' && item.rating > 0 && (
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: Math.min(Math.round(item.rating), 5) }).map((_, starIndex) => (
                        <Star key={starIndex} className="h-3.5 w-3.5 fill-current" style={{ color: GOLD }} />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* GALLERY                                                                     */
/* -------------------------------------------------------------------------- */

function GalleryBlock({ block }: { block: SiteBlock }) {
  const data = (block.data || {}) as Record<string, unknown>
  const images = toStringArray(data.images)
  const columns = normalizeNumber(data.columns, 3, 2, 4)

  if (images.length === 0) return null

  return (
    <section className="py-20 sm:py-24" style={{ background: LIGHT }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {block.title && (
          <Reveal>
            <div className="mb-10">
              <SectionLabel>{block.subtitle}</SectionLabel>
              <h2 className="text-3xl font-black sm:text-4xl">{block.title}</h2>
            </div>
          </Reveal>
        )}

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${columns >= 4 ? 220 : 280}px, 1fr))` }}
        >
          {images.map((image, index) => (
            <Reveal key={`${image}-${index}`} delay={index * 0.03}>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-black/5">
                <img src={image} alt="" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* RICHTEXT                                                                    */
/* -------------------------------------------------------------------------- */

function RichTextBlock({ block }: { block: SiteBlock }) {
  const data = (block.data || {}) as Record<string, unknown>
  const body = typeof data.body === 'string' ? data.body : ''
  const align = data.align === 'start' ? 'text-right' : 'text-center'
  const background = typeof data.background === 'string' ? data.background : 'none'

  if (!body && !block.title) return null

  const style =
    background === 'dark'
      ? { background: DARK, color: '#fff' }
      : background === 'muted'
        ? { background: '#ece7dc' }
        : { background: LIGHT }

  return (
    <section className="py-16 sm:py-20" style={style}>
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          {block.title && <h2 className={`mb-5 text-3xl font-black ${align}`}>{block.title}</h2>}
          {body && <p className={`whitespace-pre-wrap leading-9 ${align}`}>{body}</p>}
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* IMAGE + TEXT                                                                */
/* -------------------------------------------------------------------------- */

function ImageTextBlock({ block }: { block: SiteBlock }) {
  const go = useBlockNavigate()
  const data = (block.data || {}) as Record<string, unknown>
  const images = toStringArray(data.images)
  const image = images[0] || (typeof data.imageUrl === 'string' ? data.imageUrl : '')
  const body = typeof data.body === 'string' ? data.body : ''
  const reverse = Boolean(data.reverse)
  const ctaText = typeof data.ctaText === 'string' ? data.ctaText : ''
  const ctaHref = typeof data.ctaHref === 'string' ? data.ctaHref : ''

  if (!image && !body && !block.title) return null

  return (
    <section className="py-20 sm:py-24" style={{ background: LIGHT }}>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
        <Reveal className={reverse ? 'lg:order-2' : ''}>
          {image ? (
            <img src={image} alt={block.title || ''} className="w-full rounded-3xl object-cover" />
          ) : (
            <div
              className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl"
              style={{ background: 'linear-gradient(135deg,#2b241b,#12110f)' }}
            >
              <Layers className="h-10 w-10" style={{ color: GOLD }} />
            </div>
          )}
        </Reveal>

        <Reveal className={reverse ? 'lg:order-1' : ''}>
          <SectionLabel>{block.subtitle}</SectionLabel>
          <h2 className="mb-6 text-3xl font-black leading-tight sm:text-5xl">{block.title}</h2>
          {body && <p className="whitespace-pre-wrap leading-9 text-black/60">{body}</p>}

          {ctaText && (
            <Button
              onClick={() => go(ctaHref || '/catalog')}
              className="mt-8 rounded-none px-7 py-6 font-bold text-[#17130d]"
              style={{ background: GOLD }}
            >
              {ctaText}
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          )}
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* CTA                                                                         */
/* -------------------------------------------------------------------------- */

function CtaBlock({ block }: { block: SiteBlock }) {
  const go = useBlockNavigate()
  const data = (block.data || {}) as Record<string, unknown>
  const backgroundImage = typeof data.backgroundImage === 'string' ? data.backgroundImage : ''
  const align = data.align === 'start' ? 'text-right' : 'text-center'
  const buttonText = typeof data.buttonText === 'string' ? data.buttonText : 'مشاهده کاتالوگ'
  const buttonHref = typeof data.buttonHref === 'string' ? data.buttonHref : '/catalog'
  const body = typeof data.body === 'string' ? data.body : ''

  const title = block.title || ''
  const subtitle = block.subtitle || ''

  if (!title && !subtitle && !body) return null

  return (
    <section className="relative overflow-hidden py-28 text-white sm:py-36" style={{ background: DARK }}>
      {backgroundImage && (
        <>
          <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${backgroundImage})` }} />
          <div className="absolute inset-0 bg-gradient-to-l from-[#12110f] via-[#12110f]/80 to-[#12110f]/45" />
        </>
      )}

      <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8 lg:px-10">
        <Reveal>
          <div className={align}>
            <SectionLabel>{block.subtitle}</SectionLabel>
            <h2 className="text-4xl font-black leading-[1.05] tracking-[-.03em] sm:text-6xl">{title}</h2>
            {subtitle && !block.subtitle && (
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">{subtitle}</p>
            )}
            {body && <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/65">{body}</p>}

            <Button
              onClick={() => go(buttonHref)}
              className="mt-10 h-14 rounded-none px-9 font-bold text-[#17130d] hover:opacity-90"
              style={{ background: GOLD }}
            >
              {buttonText}
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* CONTACT                                                                     */
/* -------------------------------------------------------------------------- */

function ContactBlock({ block }: { block: SiteBlock }) {
  const site = useSiteConfig()
  const data = (block.data || {}) as Record<string, unknown>
  const body = typeof data.body === 'string' ? data.body : ''
  const showForm = data.showForm !== false

  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')

  const phone = site.brand.phone || ''
  const email = site.brand.email || ''
  const address = site.brand.address || ''

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    setStatus('idle')

    const form = new FormData(event.currentTarget)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.get('name'),
          customerPhone: form.get('phone'),
          customerEmail: form.get('email') || null,
          message: form.get('message'),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'ارسال ناموفق بود')
      event.currentTarget.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="py-20 sm:py-24" style={{ background: LIGHT }}>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
        <Reveal>
          <SectionLabel>{block.subtitle}</SectionLabel>
          <h2 className="mb-6 text-3xl font-black sm:text-4xl">{block.title}</h2>
          {body && <p className="whitespace-pre-wrap leading-9 text-black/60">{body}</p>}

          <div className="mt-8 space-y-4 text-sm">
            {phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4" style={{ color: '#8a6d2f' }} />
                <span dir="ltr">{phone}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" style={{ color: '#8a6d2f' }} />
                <span dir="ltr">{email}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4" style={{ color: '#8a6d2f' }} />
                <span>{address}</span>
              </div>
            )}
            {!phone && !email && !address && (
              <p className="text-muted-foreground">اطلاعات تماس در بخش «برند و اطلاعات کسب‌وکار» تنظیم می‌شود.</p>
            )}
          </div>
        </Reveal>

        {showForm && (
          <Reveal>
            <Card className="gap-0 rounded-2xl border-black/5 bg-white p-7">
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="name" required placeholder="نام و نام خانوادگی" />
                  <Input name="phone" required placeholder="شماره تماس" dir="ltr" />
                </div>
                <Input name="email" type="email" placeholder="ایمیل" dir="ltr" />
                <Textarea name="message" required rows={5} placeholder="پیام شما" />

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-none py-6 font-bold text-[#17130d]"
                  style={{ background: GOLD }}
                >
                  {sending ? 'در حال ارسال...' : 'ارسال پیام'}
                </Button>

                {status === 'sent' && <p className="text-sm text-green-600">پیام شما ثبت شد.</p>}
                {status === 'error' && <p className="text-sm text-red-600">ارسال ناموفق بود؛ دوباره تلاش کنید.</p>}
              </form>
            </Card>
          </Reveal>
        )}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* SPACER                                                                      */
/* -------------------------------------------------------------------------- */

function SpacerBlock({ block }: { block: SiteBlock }) {
  const data = (block.data || {}) as Record<string, unknown>
  const height = normalizeNumber(data.height, 50, 0, 400)
  return <div aria-hidden style={{ height }} />
}

/* -------------------------------------------------------------------------- */
/* Renderer                                                                    */
/* -------------------------------------------------------------------------- */

export function BlockRenderer({
  blocks,
  emptyMessage = 'صفحه اصلی هنوز توسط مدیر سایت تکمیل نشده است. از بخش «طراحی سایت» بلوک دلخواه خود را اضافه کنید.',
}: {
  blocks: SiteBlock[]
  emptyMessage?: string
}) {
  const ordered = useMemo(
    () => [...blocks].filter((block) => block.enabled !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [blocks]
  )

  if (ordered.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <Card className="gap-0 border-dashed p-10">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="overflow-hidden" style={{ background: LIGHT }}>
      {ordered.map((block, index) => {
        const key = block.id || `${block.type}-${index}`

        switch (block.type) {
          case 'hero':
            return <HeroBlock key={key} block={block} />
          case 'products':
            return <ProductsBlock key={key} block={block} />
          case 'categories':
            return <CategoriesBlock key={key} block={block} />
          case 'features':
            return <FeaturesBlock key={key} block={block} />
          case 'stats':
            return <StatsBlock key={key} block={block} />
          case 'testimonials':
            return <TestimonialsBlock key={key} block={block} />
          case 'gallery':
            return <GalleryBlock key={key} block={block} />
          case 'richtext':
            return <RichTextBlock key={key} block={block} />
          case 'image-text':
            return <ImageTextBlock key={key} block={block} />
          case 'cta':
            return <CtaBlock key={key} block={block} />
          case 'contact':
            return <ContactBlock key={key} block={block} />
          case 'spacer':
            return <SpacerBlock key={key} block={block} />
          default:
            return null
        }
      })}
    </div>
  )
}
