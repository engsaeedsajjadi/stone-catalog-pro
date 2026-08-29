'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SiteRuntime } from '@/components/public/site-runtime'
import { RouterSync } from '@/components/public/router-sync'
import { useAppStore } from '@/store/app-store'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { route, isExhibitionMode } = useAppStore()

  const isLogin = route === 'login'
  const isAdmin = route === 'admin' || pathname.startsWith('/admin')
  const chromeless = isLogin || isAdmin || isExhibitionMode

  return (
    <SiteRuntime>
      <RouterSync />
      <div
        className="min-h-screen flex flex-col bg-background text-foreground site-app-shell"
        dir="rtl"
      >
        {!chromeless && <Navbar />}

        <main className="flex-1 min-w-0">
          {children}
        </main>

        {!chromeless && <Footer />}
      </div>
    </SiteRuntime>
  )
}