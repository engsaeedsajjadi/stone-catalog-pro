'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Toaster } from 'sonner'

import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SiteRuntime } from '@/components/public/site-runtime'
import { ExhibitionMode } from '@/components/public/exhibition-mode'
import { useAppStore } from '@/store/app-store'
import { hrefToRoute, routeToHref } from '@/lib/routes'

/** مسیرهایی که navbar و footer نباید داشته باشند. */
const CHROMELESS_PREFIXES = ['/login', '/admin']

function isChromeless(pathname: string): boolean {
  return CHROMELESS_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/'
  const router = useRouter()

  const lang = useAppStore(state => state.lang)
  const isExhibitionMode = useAppStore(state => state.isExhibitionMode)

  /*
   * پل بین روتر قلابیِ استور و روتر واقعی Next.
   *
   * کل کدبیس با `navigate('product', { id })` کار می‌کند. اینجا همان امضا را
   * نگه می‌داریم ولی به router.push وصلش می‌کنیم تا URL هم عوض شود. نتیجه:
   * دکمه برگشت مرورگر، لینک اشتراک‌گذاری و رفرش همه درست کار می‌کنند.
   */
  useEffect(() => {
    useAppStore.setState({
      navigate: (route: string, params: Record<string, string> = {}) => {
        const href = routeToHref(route, params)

        if (/^https?:\/\//i.test(href)) {
          window.location.href = href
          return
        }

        useAppStore.setState({ params })
        router.push(href)
      },

      logout: () => {
        // state را فوراً پاک کن تا UI بلافاصله واکنش دهد
        useAppStore.setState({ user: null })

        // و کوکی httpOnly را هم روی سرور باطل کن
        void fetch('/api/auth/logout', { method: 'POST' })
          .catch(() => {})
          .finally(() => router.push('/'))
      },
    })
  }, [router])

  /* آینه‌ی `route` در استور را با URL واقعی هم‌گام نگه می‌داریم. */
  useEffect(() => {
    useAppStore.setState({ route: hrefToRoute(pathname) })
  }, [pathname])

  /*
   * بازیابی سشن از کوکی httpOnly.
   *
   * `user` عمداً persist نمی‌شود، ولی هیچ‌جا هم خوانده نمی‌شد؛ نتیجه این بود
   * که هر رفرش کاربر را بیرون‌افتاده نشان می‌داد.
   */
  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/me', { cache: 'no-store' })
      .then(response => (response.ok ? response.json() : null))
      .then(payload => {
        if (cancelled) return
        const user = payload?.data || payload?.user || null
        if (user?.id) useAppStore.setState({ user })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  /* جهت و زبان سند در همه‌ی مسیرها، نه فقط صفحه اصلی. */
  useEffect(() => {
    const rtl = lang === 'fa' || lang === 'ar'
    document.documentElement.lang = lang
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const rtl = lang === 'fa' || lang === 'ar'
  const chromeless = isChromeless(pathname)

  return (
    <SiteRuntime>
      <div
        className="min-h-screen flex flex-col bg-background text-foreground site-app-shell"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        {!chromeless && <Navbar />}

        <main className="flex-1 min-w-0">{children}</main>

        {!chromeless && <Footer />}
      </div>

      {/* حالت نمایشگاه یک overlay سراسری است، نه چیزی مخصوص صفحه اصلی */}
      {isExhibitionMode && <ExhibitionMode />}

      {/* یک Toaster برای کل اپ. قبلاً فقط در `/` مونت می‌شد و همه‌ی
          toast.error های بقیه صفحات بی‌صدا گم می‌شدند. */}
      <Toaster position="top-center" richColors />
    </SiteRuntime>
  )
}
