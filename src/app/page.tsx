'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { HomePage } from '@/components/public/home-page'
import { CatalogPage } from '@/components/public/catalog-page'
import { ProductDetailPage } from '@/components/public/product-detail-page'
import { ComparePage } from '@/components/public/compare-page'
import { LoginPage } from '@/components/public/login-page'
import { AdminPage } from '@/components/admin/admin-page'
import { Toaster as SonnerToaster } from 'sonner'
import { SiteRuntime, useSiteConfig } from '@/components/public/site-runtime'

export default function Home() {
  const { route, params, navigate, isExhibitionMode, lang } = useAppStore()

  // Handle URL params (deep linking for product view, search, etc.)
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{}) }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    const productParam = url.searchParams.get('product')
    const qParam = url.searchParams.get('q')
    const langParam = url.searchParams.get('lang')

    if (productParam) navigate('product', { id: productParam })
    else if (qParam) navigate('catalog', { q: qParam })
  }, [])

  // Update document direction and language when language changes
  useEffect(() => {
    const isRTL = lang === 'fa' || lang === 'ar'
    document.documentElement.lang = lang
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.body.dir = isRTL ? 'rtl' : 'ltr'
  }, [lang])

  const isRTL = lang === 'fa' || lang === 'ar'

  // Hide chrome for login & admin & exhibition
  const isChromeless = route === 'login' || route === 'admin' || isExhibitionMode

  return (
    <SiteRuntime><div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {!isChromeless && <Navbar />}

      <main className="flex-1">
        {route === 'home' && <HomePage />}
        {route === 'catalog' && <CatalogPage />}
        {route === 'product' && <ProductDetailPage />}
        {route === 'export' && <CatalogPage />}
        {route === 'compare' && <ComparePage />}
        {route === 'favorites' && <FavoritesPage />}
        {route === 'about' && <AboutPage />}
        {route === 'contact' && <ContactPage />}
        {route === 'login' && <LoginPage />}
        {route === 'admin' && <AdminPage />}
        {isExhibitionMode && <ExhibitionMode />}
      </main>

      {!isChromeless && <Footer />}
      <SonnerToaster position="top-center" richColors />
    </div></SiteRuntime>
  )
}

// ============ Simple Pages ============
function FavoritesPage() {
  const { favorites, navigate } = useAppStore()

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">علاقه‌مندی‌های شما</h2>
        <p className="text-muted-foreground mb-6">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید</p>
        <button onClick={() => navigate('catalog')} className="text-primary hover:underline">
          مشاهده کاتالوگ
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black mb-6">علاقه‌مندی‌های من ({favorites.length})</h1>
      <p className="text-muted-foreground">برای مشاهده محصولات علاقه‌مند شده، به کاتالوگ مراجعه کنید.</p>
    </div>
  )
}

function AboutPage() {
  const { navigate } = useAppStore(); const site=useSiteConfig(); const page=site.pages.about
  return <div className="min-h-screen"><section className="py-20 text-white" style={{background:'linear-gradient(135deg,var(--site-secondary),var(--site-primary))'}}><div className="container mx-auto px-4 max-w-4xl text-center"><h1 className="text-4xl md:text-5xl font-black mb-5">{page?.title||site.brand.nameFa||site.brand.nameEn||''}</h1><p className="text-lg text-white/80">{site.brand.taglineFa||site.brand.taglineEn||''}</p></div></section><div className="container mx-auto px-4 py-12 space-y-8">{page?.blocks.filter(b=>b.enabled).map(b=><Card key={b.id} className="p-8"><h2 className="text-2xl font-bold mb-4">{b.title}</h2><p className="leading-8 whitespace-pre-wrap text-muted-foreground">{String(b.data?.body||'')}</p>{b.imageUrl&&<img src={b.imageUrl} alt={b.title||''} className="mt-6 rounded-2xl w-full max-h-[520px] object-cover"/>}</Card>)}{(!page||page.blocks.filter(b=>b.enabled).length===0)&&<Card className="p-10 text-center border-dashed"><p className="text-muted-foreground">این صفحه هنوز توسط مدیر سایت تکمیل نشده است.</p></Card>}<div className="flex gap-3"><button onClick={()=>navigate('contact')} className="bg-primary text-primary-foreground px-5 py-3 rounded-lg">تماس با ما</button><button onClick={()=>navigate('catalog')} className="border px-5 py-3 rounded-lg">مشاهده کاتالوگ</button></div></div></div>
}

function ContactPage() {
  const site=useSiteConfig()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSubmitting(true); setMessage('')
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: form.get('name'), customerPhone: form.get('phone'), customerEmail: form.get('email') || null, inquiryType: 'CONTACT', message: form.get('message') }) })
      const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error || 'ارسال ناموفق بود')
      e.currentTarget.reset(); setMessage('پیام شما ثبت شد و توسط تیم فروش پیگیری خواهد شد.')
    } catch (err) { setMessage(err instanceof Error ? err.message : 'خطا در ارسال') } finally { setSubmitting(false) }
  }
  return <div className="min-h-screen"><div className="bg-gradient-to-br from-brand-950 to-brand-700 text-white py-16"><div className="container mx-auto px-4"><h1 className="text-4xl font-black">تماس با ما</h1><p className="text-white/70 mt-2">اطلاعات تماس در سامانه مدیریت می‌شود.</p></div></div><div className="container mx-auto px-4 py-12 max-w-3xl"><Card className="p-7"><form className="space-y-5" onSubmit={submit}><div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm mb-2">نام و نام خانوادگی</label><input name="name" required className="w-full rounded-lg border px-3 py-2" /></div><div><label className="block text-sm mb-2">شماره تماس</label><input name="phone" required className="w-full rounded-lg border px-3 py-2" dir="ltr" /></div></div><div><label className="block text-sm mb-2">ایمیل</label><input name="email" type="email" className="w-full rounded-lg border px-3 py-2" dir="ltr" /></div><div><label className="block text-sm mb-2">پیام</label><textarea name="message" required rows={6} className="w-full rounded-lg border px-3 py-2" /></div><button disabled={submitting} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg">{submitting ? 'در حال ارسال...' : 'ثبت درخواست'}</button>{message && <p className="text-sm text-muted-foreground">{message}</p>}</form></Card></div></div>
}

function ExhibitionMode() {
  const { navigate } = useAppStore(); const site=useSiteConfig(); const [stones,setStones]=useState<any[]>([]); const [index,setIndex]=useState(0)
  useEffect(()=>{fetch('/api/products?pageSize=24&sort=popular',{cache:'no-store'}).then(r=>r.json()).then(d=>setStones(d.data||[])).catch(()=>{})},[])
  useEffect(()=>{const ms=Number(site.pages.home?.blocks.find(b=>b.type==='gallery')?.data?.intervalMs||8000); if(stones.length<2)return; const id=window.setInterval(()=>setIndex(i=>(i+1)%stones.length),ms); return()=>window.clearInterval(id)},[stones.length,site])
  const stone=stones[index]; return <div className="fixed inset-0 z-50 text-white p-6 md:p-10 flex flex-col" style={{background:'linear-gradient(135deg,var(--site-secondary),var(--site-primary))'}}><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black">{site.brand.nameFa||site.brand.nameEn||''}</h1><p className="text-sm text-white/60">{site.brand.taglineFa||site.brand.taglineEn||''}</p></div><button onClick={()=>navigate('home')} className="border rounded-lg px-4 py-2">خروج</button></div><div className="flex-1 flex items-center justify-center">{stone?<div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">{stone.images?.[0]?.url?<img src={stone.images[0].url} alt={stone.name} className="w-full max-h-[70vh] object-contain rounded-3xl"/>:<div className="aspect-video rounded-3xl bg-white/10"/>}<div><div className="text-sm text-white/60">{stone.code}</div><h2 className="text-5xl font-black mt-2 mb-5">{stone.name}</h2><p className="text-lg text-white/75 leading-8">{stone.description||''}</p><button onClick={()=>navigate('product',{id:stone.id})} className="mt-8 px-6 py-3 rounded-xl" style={{background:'var(--site-accent)',color:'var(--site-secondary)'}}>مشاهده جزئیات</button></div></div>:<div className="text-center"><h2 className="text-3xl font-black mb-3">{site.pages.home?.title||''}</h2><p className="text-white/60">برای حالت نمایشگاهی، محصولات واقعی را از پنل مدیریت ثبت کنید.</p></div>}</div></div>
}

