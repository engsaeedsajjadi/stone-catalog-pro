'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/components/stone/product-card'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Search, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, TrendingUp,
  Globe2, Award, Factory, Users, Package, Truck, ShieldCheck, Phone,
  MapPin, Mail, Star, Quote, ArrowUpLeft,
} from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Stone = any

const ease = [0.22, 1, 0.36, 1] as const

export function HomePage() {
  const { navigate, t } = useAppStore()
  const [featuredStones, setFeaturedStones] = useState<Stone[]>([])
  const [newestStones, setNewestStones] = useState<Stone[]>([])
  const [bestSellers, setBestSellers] = useState<Stone[]>([])
  const [exportStones, setExportStones] = useState<Stone[]>([])
  const [categories, setCategories] = useState<Stone[]>([])
  const [heroSlide, setHeroSlide] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(true)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    Promise.all([
      fetch('/api/products?featured=true&pageSize=8').then(r => r.json()),
      fetch('/api/products?newest=true&pageSize=8').then(r => r.json()),
      fetch('/api/products?bestseller=true&pageSize=8').then(r => r.json()),
      fetch('/api/products?export=true&pageSize=8').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([f, n, b, e, c]) => {
      setFeaturedStones(f.data || [])
      setNewestStones(n.data || [])
      setBestSellers(b.data || [])
      setExportStones(e.data || [])
      setCategories(c.data || [])
      setLoading(false)
    })
  }, [])

  const heroSlides = [
    { title: 'مرمریت پرشین سیلک', subtitle: 'لوکس‌ترین سنگ ایران، رقیب Calacatta ایتالیایی', image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1920&q=85', ctaText: 'مشاهده کاتالوگ', badge: 'صادراتی به اروپا و آمریکا' },
    { title: 'تراورتن عباس آباد سفید', subtitle: 'بهترین تراورتن جهان برای نمای بیرونی', image: 'https://images.unsplash.com/photo-1604014237744-e6acea5fac74?w=1920&q=85', ctaText: 'مشاهده محصولات', badge: 'صادرات به ۳۰+ کشور' },
    { title: 'اونیکس سبز پارسیان', subtitle: 'شفافیت نور منحصر به فرد برای دکوراسیون لوکس', image: 'https://images.unsplash.com/photo-1615873968403-89e06ab64667?w=1920&q=85', ctaText: 'کشف کنید', badge: 'محدود و کمیاب' },
    { title: 'گرانیت نطنز مشکی', subtitle: 'سختی فوق‌العاده برای کف‌های پرترافیک', image: 'https://images.unsplash.com/photo-1604014237800-1c9102c21903?w=1920&q=85', ctaText: 'مشاهده', badge: 'پرفروش‌ترین' },
  ]

  useEffect(() => {
    const interval = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 6000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { icon: Package, label: 'محصولات', value: '+۲۵۰', sub: 'نوع سنگ' },
    { icon: Factory, label: 'کارخانه', value: '۲', sub: 'واحد فرآوری' },
    { icon: Globe2, label: 'صادرات', value: '+۳۰', sub: 'کشور دنیا' },
    { icon: Users, label: 'مشتریان', value: '+۵۰۰۰', sub: 'مشتری وفادار' },
  ]

  const features = [
    { icon: TrendingUp, title: 'قیمت روز', desc: 'قیمت‌های به‌روز با تاریخ اعتبار، شامل قیمت داخلی و صادراتی به ۶ ارز' },
    { icon: ShieldCheck, title: 'کیفیت تضمینی', desc: 'استاندارد ISO 9001 و گواهی کیفیت برای هر محموله صادراتی' },
    { icon: Truck, title: 'تحویل سریع', desc: 'شبکه گسترده انبارها در تهران، اصفهان و محلات، تحویل ۷ روزه' },
    { icon: Award, title: '۲۵ سال تجربه', desc: 'پیشگام در استخراج و فرآوری سنگ‌های ایرانی با کیفیت جهانی' },
  ]

  const projects = [
    { title: 'هتل ۵ ستاره دبی', desc: 'مرمریت پرشین سیلک در لابی', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=85' },
    { title: 'برج مسکونی تهران', desc: 'نمای تراورتن عباس آباد سفید', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&q=85' },
    { title: 'ویلا لوکس اصفهان', desc: 'دکوراسیون داخلی با اونیکس سبز', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&q=85' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('catalog', { q: searchValue })
  }

  const reveal = reduceMotion
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
    : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 } }

  return (
    <main className="overflow-hidden bg-[#f4f0e8]">
      {/* Cinematic Hero */}
      <section className="relative min-h-[min(920px,100svh)] overflow-hidden bg-[#11100f] text-white">
        {heroSlides.map((slide, i) => (
          <motion.div key={i} className="absolute inset-0" initial={false} animate={{ opacity: heroSlide === i ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 1.1, ease }}>
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              animate={{ scale: heroSlide === i && !reduceMotion ? 1.03 : 1 }}
              transition={{ duration: 7, ease: 'linear' }}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,9,8,.94)_0%,rgba(10,9,8,.68)_38%,rgba(10,9,8,.2)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,9,8,.88)_0%,transparent_48%,rgba(10,9,8,.2)_100%)]" />
          </motion.div>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[min(920px,100svh)] max-w-7xl items-center px-5 pb-20 pt-28 sm:px-8 lg:px-10">
          <motion.div key={heroSlide} initial={{ opacity: 0, y: reduceMotion ? 0 : 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease }} className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-[#dfc58b] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              {heroSlides[heroSlide].badge}
            </div>
            <div className="mb-5 text-[10px] font-bold uppercase tracking-[.45em] text-white/45">STONE CATALOG PRO / 2026</div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-[-.045em] sm:text-7xl lg:text-[7.2rem]">
              {heroSlides[heroSlide].title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/78 sm:text-2xl">{heroSlides[heroSlide].subtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate('catalog')} className="h-14 rounded-none bg-[#d6b66a] px-8 font-bold text-[#17130d] hover:bg-[#e5cb8c]">
                {heroSlides[heroSlide].ctaText}<ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('contact')} className="h-14 rounded-none border-white/30 bg-white/5 px-8 text-white backdrop-blur-md hover:bg-white/10 hover:text-white">
                درخواست استعلام
              </Button>
            </div>

            <form onSubmit={handleSearch} className="mt-10 max-w-2xl">
              <div className="flex items-center border border-white/15 bg-black/30 p-1.5 backdrop-blur-xl">
                <Input value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder={t('search.placeholder')} className="h-12 border-0 bg-transparent text-white placeholder:text-white/45 focus-visible:ring-0" />
                <Button type="submit" className="h-12 rounded-none bg-white px-6 text-[#17130d] hover:bg-[#f1e6ce]"><Search className="ml-2 h-4 w-4" />{t('common.search')}</Button>
              </div>
            </form>
          </motion.div>
        </div>

        <div className="absolute bottom-8 right-5 z-20 flex items-end gap-5 sm:right-10">
          <div className="hidden text-[9px] font-bold tracking-[.4em] text-white/45 sm:block">SCROLL</div>
          <div className="h-16 w-px bg-gradient-to-b from-[#d6b66a] to-transparent" />
          <div className="flex gap-2">
            <button onClick={() => setHeroSlide(s => (s - 1 + heroSlides.length) % heroSlides.length)} className="h-11 w-11 border border-white/20 bg-black/20 text-white transition hover:border-[#d6b66a] hover:text-[#d6b66a]" aria-label="Previous"><ChevronRight className="mx-auto h-4 w-4" /></button>
            <button onClick={() => setHeroSlide(s => (s + 1) % heroSlides.length)} className="h-11 w-11 border border-white/20 bg-black/20 text-white transition hover:border-[#d6b66a] hover:text-[#d6b66a]" aria-label="Next"><ChevronLeft className="mx-auto h-4 w-4" /></button>
          </div>
        </div>
        <div className="absolute bottom-10 left-5 z-20 flex items-center gap-2 sm:left-10">
          {heroSlides.map((_, i) => <button key={i} onClick={() => setHeroSlide(i)} aria-label={`Slide ${i + 1}`} className={`h-px transition-all duration-500 ${heroSlide === i ? 'w-14 bg-[#d6b66a]' : 'w-5 bg-white/35'}`} />)}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#151311] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 border-x border-white/10 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={i} {...reveal} viewport={{ once: true }} transition={{ delay: i * .08, duration: .6 }} className="group border-b border-white/10 p-7 sm:border-b-0 sm:border-l sm:p-9 last:border-l-0">
              <stat.icon className="mb-8 h-5 w-5 text-[#d6b66a] transition-transform duration-500 group-hover:-translate-y-1" />
              <div className="text-4xl font-black tracking-tight sm:text-5xl">{stat.value}</div>
              <div className="mt-2 text-sm text-white/60">{stat.label} <span className="text-white/25">/</span> {stat.sub}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Brand statement */}
      <section className="relative bg-[#f4f0e8] py-28 sm:py-40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-7 text-[10px] font-bold tracking-[.4em] text-[#a18a5b]">01 / MATERIAL & ARCHITECTURE</div>
          <motion.h2 {...reveal} viewport={{ once: true }} transition={{ duration: .8 }} className="max-w-6xl text-5xl font-black leading-[.98] tracking-[-.045em] text-[#181613] sm:text-7xl lg:text-[7rem]">
            STONE IS NOT JUST A MATERIAL.<br /><span className="text-[#a48b59]">IT DEFINES SPACE.</span>
          </motion.h2>
          <div className="mt-12 grid gap-8 border-t border-[#181613]/15 pt-8 md:grid-cols-2">
            <p className="max-w-xl text-xl leading-9 text-[#5d5850]">سنگ فقط یک متریال نیست؛ هویت فضا را تعریف می‌کند. از معدن تا معماری، انتخاب متریال مناسب نقطه شروع یک پروژه ماندگار است.</p>
            <p className="max-w-xl text-base leading-8 text-[#777168] md:mr-auto">Stone Catalog Pro مجموعه‌ای حرفه‌ای برای کشف، مقایسه و معرفی سنگ‌های طبیعی ایران با رویکردی مدرن و تجاری است.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#e9e3d8] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading number="02" eyebrow="WHY STONE CATALOG PRO" title="تجربه‌ای متفاوت از انتخاب سنگ" description="اطلاعات، کیفیت و تجربه حرفه‌ای در یک مسیر ساده و شفاف." />
          <div className="mt-14 grid border-t border-[#29251f]/15 md:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div key={i} {...reveal} viewport={{ once: true }} transition={{ delay: i * .07, duration: .65 }} className="group border-b border-[#29251f]/15 p-7 sm:p-10 md:even:border-r">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#a48b59]/40 text-[#a48b59]"><feature.icon className="h-5 w-5" /></div>
                  <span className="text-xs font-bold tracking-[.3em] text-[#aaa296]">0{i + 1}</span>
                </div>
                <h3 className="mt-10 text-2xl font-black text-[#1a1815]">{feature.title}</h3>
                <p className="mt-3 max-w-xl leading-8 text-[#6b655c]">{feature.desc}</p>
                <div className="mt-7 h-px w-0 bg-[#a48b59] transition-all duration-700 group-hover:w-24" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-[#151311] py-24 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading dark number="03" eyebrow="STONE COLLECTION" title="مواد اولیه برای فضاهای ماندگار" description="دسته‌بندی‌های واقعی کاتالوگ را با همان داده موجود، در یک تجربه تصویری جدید ببینید." />
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((cat: any, i: number) => (
              <motion.button key={cat.id || i} onClick={() => navigate('catalog', { category: cat.slug })} {...reveal} viewport={{ once: true }} transition={{ delay: i * .05, duration: .6 }} className="group relative aspect-[4/5] overflow-hidden text-right">
                {cat.image ? <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#4b453c] to-[#1a1815]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-6">
                  <div className="mb-2 text-[9px] font-bold tracking-[.3em] text-[#d6b66a]">COLLECTION {String(i + 1).padStart(2, '0')}</div>
                  <div className="flex items-end justify-between gap-3"><h3 className="text-xl font-black">{cat.name}</h3><ArrowUpLeft className="h-5 w-5 text-white/70 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" /></div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <ProductSection title={t('section.featured')} badge="محصولات منتخب" icon={Star} stones={featuredStones} loading={loading} onViewAll={() => navigate('catalog', { featured: 'true' })} />
      <ProductSection title={t('section.newest')} badge="تازه‌ها" icon={Sparkles} stones={newestStones} loading={loading} onViewAll={() => navigate('catalog', { newest: 'true' })} alt />

      {/* Digital Catalog */}
      <section className="bg-[#171512] py-24 text-white sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid items-center gap-14 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <div className="mb-6 text-[10px] font-bold tracking-[.4em] text-[#d6b66a]">04 / DIGITAL CATALOG</div>
              <motion.h2 {...reveal} viewport={{ once: true }} transition={{ duration: .8 }} className="text-5xl font-black leading-[1.02] tracking-[-.04em] sm:text-6xl">YOUR STONE<br /><span className="text-[#d6b66a]">CATALOG.</span><br />SMARTER.</motion.h2>
              <p className="mt-7 max-w-lg text-lg leading-8 text-white/60">کاتالوگ دیجیتال فعلی پروژه را به عنوان یک تجربه حرفه‌ای معرفی کن؛ جستجو، دسته‌بندی، قیمت و جزئیات محصول بدون تغییر در منطق اصلی.</p>
              <Button onClick={() => navigate('catalog')} className="mt-9 h-14 rounded-none bg-[#d6b66a] px-7 font-bold text-[#17130d] hover:bg-[#e5cb8c]">ورود به کاتالوگ <ArrowLeft className="mr-2 h-4 w-4" /></Button>
            </div>
            <motion.div {...reveal} viewport={{ once: true }} transition={{ duration: .9 }} className="relative">
              <div className="absolute -inset-6 bg-[#d6b66a]/5 blur-3xl" />
              <div className="relative overflow-hidden border border-white/10 bg-[#211e1a] p-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex gap-1.5"><i className="h-2 w-2 rounded-full bg-white/20" /><i className="h-2 w-2 rounded-full bg-white/20" /><i className="h-2 w-2 rounded-full bg-white/20" /></div><span className="text-[9px] tracking-[.3em] text-white/35">STONE CATALOG PRO</span></div>
                <div className="grid grid-cols-12 gap-3 p-4 sm:p-6">
                  <div className="col-span-3 hidden space-y-2 sm:block"><div className="h-8 bg-white/10" /><div className="h-3 w-4/5 bg-white/5" /><div className="h-3 w-3/5 bg-white/5" /><div className="mt-8 h-24 bg-white/5" /><div className="h-24 bg-white/5" /></div>
                  <div className="col-span-12 sm:col-span-9"><div className="mb-4 flex h-9 items-center justify-between bg-white/5 px-3"><span className="text-[10px] text-white/35">جستجوی سنگ...</span><Search className="h-3.5 w-3.5 text-[#d6b66a]" /></div><div className="grid grid-cols-2 gap-3">{(featuredStones.length ? featuredStones.slice(0, 4) : [1,2,3,4]).map((stone: any, i: number) => <div key={stone.id || i} className="overflow-hidden bg-white/5"><div className="aspect-[4/3] bg-gradient-to-br from-[#655d50] to-[#24211d]">{stone.images?.[0]?.url && <img src={stone.images[0].url} alt={stone.name || ''} className="h-full w-full object-cover" />}</div><div className="p-3"><div className="h-2 w-3/4 bg-white/15" /><div className="mt-2 h-2 w-1/2 bg-[#d6b66a]/30" /></div></div>)}</div></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <ProductSection title={t('section.bestseller')} badge="پرفروش‌ترین" icon={TrendingUp} stones={bestSellers} loading={loading} onViewAll={() => navigate('catalog', { bestseller: 'true' })} />
      <ProductSection title={t('section.export')} badge="صادراتی" icon={Globe2} stones={exportStones} loading={loading} onViewAll={() => navigate('catalog', { export: 'true' })} alt />

      {/* Applications / Factory */}
      <section className="bg-[#f4f0e8] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionHeading number="05" eyebrow="FROM QUARRY TO ARCHITECTURE" title="از معدن تا فضای نهایی" description="روایت یک متریال از استخراج و فرآوری تا استفاده در معماری و طراحی داخلی." />
          <div className="mt-14 grid gap-4 lg:grid-cols-2">
            {[
              ['01', 'معدن', 'انتخاب متریال از منابع طبیعی ایران'],
              ['02', 'فرآوری', 'پرداخت و آماده‌سازی با استانداردهای حرفه‌ای'],
              ['03', 'کنترل کیفیت', 'بررسی کیفیت و مشخصات هر محصول'],
              ['04', 'معماری', 'تبدیل متریال به بخشی از یک فضای ماندگار'],
            ].map(([n, title, desc], i) => <motion.div key={n} {...reveal} viewport={{ once: true }} transition={{ delay: i * .06 }} className="group border-t border-[#1d1a16]/15 py-7 sm:py-9"><div className="grid grid-cols-[70px_1fr_auto] items-start gap-5"><span className="text-xs font-bold tracking-[.25em] text-[#a48b59]">{n}</span><div><h3 className="text-2xl font-black">{title}</h3><p className="mt-2 max-w-xl text-[#70695f]">{desc}</p></div><ArrowUpLeft className="h-5 w-5 text-[#aaa296] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" /></div></motion.div>)}
          </div>
        </div>
      </section>

      {/* About / Factory */}
      <section className="relative overflow-hidden bg-[#12110f] py-24 text-white sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
          <div><div className="mb-6 text-[10px] font-bold tracking-[.4em] text-[#d6b66a]">06 / OUR FACTORY</div><h2 className="text-4xl font-black leading-tight sm:text-6xl">۲۵ سال تجربه در استخراج و فرآوری سنگ ایرانی</h2><p className="mt-7 text-lg leading-9 text-white/65">سنگیران کاتالوگ با بیش از ۲۵ سال تجربه در صنعت سنگ ایران، یکی از پیشگامان استخراج، فرآوری و صادرات سنگ‌های طبیعی به سراسر جهان است.</p><p className="mt-4 leading-8 text-white/45">محصولات به بیش از ۳۰ کشور جهان صادر می‌شوند و تمرکز ما بر کیفیت، شفافیت و تجربه حرفه‌ای مشتری است.</p><Button onClick={() => navigate('about')} className="mt-8 rounded-none bg-[#d6b66a] font-bold text-[#17130d] hover:bg-[#e5cb8c]">درباره ما <ArrowLeft className="mr-2 h-4 w-4" /></Button></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-3 pt-8"><div className="aspect-[3/4] overflow-hidden"><img src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=85" alt="Factory" className="h-full w-full object-cover transition duration-700 hover:scale-105" /></div><div className="aspect-square overflow-hidden"><img src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=85" alt="Quarry" className="h-full w-full object-cover transition duration-700 hover:scale-105" /></div></div><div className="space-y-3"><div className="aspect-square overflow-hidden"><img src="https://images.unsplash.com/photo-1581094271901-8022df4b6f49?w=800&q=85" alt="Process" className="h-full w-full object-cover transition duration-700 hover:scale-105" /></div><div className="aspect-[3/4] overflow-hidden"><img src="https://images.unsplash.com/photo-1565728744382-61accd4aa148?w=800&q=85" alt="Showroom" className="h-full w-full object-cover transition duration-700 hover:scale-105" /></div></div></div>
        </div></div>
      </section>

      {/* Projects */}
      <section className="bg-[#e9e3d8] py-24 sm:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionHeading number="07" eyebrow="ARCHITECTURAL PROJECTS" title="سنگ در مقیاس معماری" description="نمونه‌هایی از کاربرد متریال در پروژه‌های لوکس و حرفه‌ای." /><div className="mt-14 grid gap-4 md:grid-cols-3">{projects.map((proj, i) => <motion.div key={i} {...reveal} viewport={{ once: true }} transition={{ delay: i * .08 }} className="group relative aspect-[4/5] overflow-hidden"><img src={proj.img} alt={proj.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" /><div className="absolute bottom-0 right-0 left-0 p-6 text-white"><div className="mb-3 text-[9px] tracking-[.3em] text-[#d6b66a]">PROJECT / 0{i + 1}</div><h3 className="text-2xl font-black">{proj.title}</h3><p className="mt-1 text-sm text-white/65">{proj.desc}</p></div></motion.div>)}</div></div></section>

      {/* Testimonials */}
      <section className="bg-[#f4f0e8] py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionHeading number="08" eyebrow="CLIENTS" title="اعتماد از بازارهای مختلف" description="بازخورد مشتریان درباره کیفیت متریال و همکاری حرفه‌ای." /><div className="mt-14 grid gap-4 md:grid-cols-3">{[
        { name: 'Ahmed Al-Rashed', company: 'Al-Rashed Trading, Dubai', text: 'کیفیت مرمریت پرشین سیلک فوق‌العاده است. در پروژه هتل ۵ ستاره ما در دبی، همه مشتریان از زیبایی آن شگفت‌زده شدند.', img: 'https://i.pravatar.cc/100?u=ahmed' },
        { name: 'Li Wei', company: 'Shanghai Stone Imports, China', text: 'همکاری حرفه‌ای و تحویل به موقع. تراورتن عباس آباد سفید یکی از پرفروش‌ترین محصولات ما در چین شده است.', img: 'https://i.pravatar.cc/100?u=liwei' },
        { name: 'Carlos Mendoza', company: 'Mendoza Arquitectos, Spain', text: 'بهترین کیفیت گرانیت نطنز را از این تیم خریداری کردیم. قیمت رقابتی و خدمات پس از فروش عالی.', img: 'https://i.pravatar.cc/100?u=carlos' },
      ].map((test, i) => <motion.div key={i} {...reveal} viewport={{ once: true }} transition={{ delay: i * .08 }} className="border-t border-[#1d1a16]/15 p-6 sm:p-8"><Quote className="h-8 w-8 text-[#b39a68]" /><p className="mt-7 text-lg leading-8 text-[#4e4942]">{test.text}</p><div className="mt-8 flex items-center gap-3"><img src={test.img} alt={test.name} className="h-11 w-11 rounded-full object-cover grayscale" /><div><div className="font-bold">{test.name}</div><div className="text-xs text-[#777168]">{test.company}</div></div></div></motion.div>)}</div></div></section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[#12110f] py-28 text-white sm:py-40"><div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1920&q=85')] bg-cover bg-center opacity-20" /><div className="absolute inset-0 bg-gradient-to-l from-[#12110f] via-[#12110f]/80 to-[#12110f]/45" /><div className="relative mx-auto max-w-7xl px-5 text-center sm:px-8 lg:px-10"><div className="mx-auto max-w-5xl"><div className="mb-7 text-[10px] font-bold tracking-[.45em] text-[#d6b66a]">09 / START YOUR PROJECT</div><h2 className="text-5xl font-black leading-[.98] tracking-[-.04em] sm:text-7xl lg:text-[6.5rem]">FIND THE RIGHT STONE<br /><span className="text-[#d6b66a]">FOR YOUR NEXT PROJECT.</span></h2><p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-white/60">سنگ مناسب پروژه بعدی خود را از میان مجموعه محصولات موجود پیدا کنید.</p><div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => navigate('catalog')} className="h-14 rounded-none bg-[#d6b66a] px-9 font-bold text-[#17130d] hover:bg-[#e5cb8c]">مشاهده کالکشن <ArrowLeft className="mr-2 h-5 w-5" /></Button><Button onClick={() => navigate('contact')} variant="outline" className="h-14 rounded-none border-white/25 bg-white/5 px-9 text-white hover:bg-white/10 hover:text-white">درخواست استعلام</Button></div></div></div></section>

      {/* Contact preview */}
      <section className="bg-[#151311] py-12 text-white"><div className="mx-auto grid max-w-7xl gap-px bg-white/10 px-5 sm:grid-cols-3 sm:px-8 lg:px-10">{[
        { icon: Phone, title: 'تماس تلفنی', value: '+98 21 1234 5678', sub: 'شنبه تا پنجشنبه، ۹ تا ۱۸' },
        { icon: Mail, title: 'ایمیل', value: 'info@stonecatalog.ir', sub: 'پاسخ در کمتر از ۲ ساعت' },
        { icon: MapPin, title: 'آدرس', value: 'تهران - شمس‌آباد', sub: 'شهرک صنعتی، خیابان ۱۲' },
      ].map((item, i) => <div key={i} className="bg-[#151311] p-7"><item.icon className="mb-6 h-5 w-5 text-[#d6b66a]" /><div className="text-xs text-white/40">{item.title}</div><div className="mt-1 font-bold">{item.value}</div><div className="mt-1 text-xs text-white/35">{item.sub}</div></div>)}</div></section>
    </main>
  )
}

function SectionHeading({ number, eyebrow, title, description, dark = false }: { number: string; eyebrow: string; title: string; description: string; dark?: boolean }) {
  return <div className="max-w-4xl"><div className={`mb-5 text-[10px] font-bold tracking-[.38em] ${dark ? 'text-[#d6b66a]' : 'text-[#a48b59]'}`}>{number} / {eyebrow}</div><h2 className={`text-4xl font-black leading-tight tracking-[-.035em] sm:text-6xl ${dark ? 'text-white' : 'text-[#171512]'}`}>{title}</h2><p className={`mt-5 max-w-2xl text-lg leading-8 ${dark ? 'text-white/55' : 'text-[#70695f]'}`}>{description}</p></div>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProductSection({ title, badge, icon: Icon, stones, loading, onViewAll, alt }: any) {
  if (loading) return <section className={`py-20 ${alt ? 'bg-[#e9e3d8]' : 'bg-[#f4f0e8]'}`}><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="mb-10 h-20 w-64 shimmer" /><div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="aspect-[4/3] bg-black/5 shimmer" />)}</div></div></section>
  if (!stones || stones.length === 0) return null
  return <section className={`py-20 sm:py-28 ${alt ? 'bg-[#e9e3d8]' : 'bg-[#f4f0e8]'}`}>
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="mb-10 flex items-end justify-between gap-5 border-b border-[#1d1a16]/15 pb-7"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[.35em] text-[#a48b59]"><Icon className="h-3.5 w-3.5" /> {badge}</div><h2 className="text-3xl font-black tracking-[-.03em] sm:text-5xl">{title}</h2></div><Button variant="ghost" onClick={onViewAll} className="hidden rounded-none md:flex">مشاهده همه <ArrowLeft className="mr-2 h-4 w-4" /></Button></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{stones.slice(0, 8).map((stone: any) => <ProductCard key={stone.id} stone={stone} />)}</div>
      <div className="mt-8 text-center md:hidden"><Button variant="outline" onClick={onViewAll} className="rounded-none">مشاهده همه <ArrowLeft className="mr-2 h-4 w-4" /></Button></div>
    </div>
  </section>
}
