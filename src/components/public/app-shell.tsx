'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SiteRuntime } from '@/components/public/site-runtime'
import { useAppStore } from '@/store/app-store'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { route, isExhibitionMode } = useAppStore()

  const isLogin = route === 'login'
  const isAdmin = route === 'admin' || pathname.startsWith('/admin')
  const chromeless = isLogin || isAdmin || isExhibitionMode

  return (
    <SiteRuntime>
      <div className="min-h-screen flex flex-col bg-background text-foreground site-app-shell" dir="rtl">
        {!chromeless && (
          <Navbar
            onHome={() => router.push('/')}
            onCatalog={() => router.push('/catalog')}
          />
        )}

        <main className="flex-1 min-w-0">{children}</main>

        {!chromeless && <Footer />}
      </div>
    </SiteRuntime>
  )
}
