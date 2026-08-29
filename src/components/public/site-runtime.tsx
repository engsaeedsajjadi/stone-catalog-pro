'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { SiteConfig } from '@/lib/site-config-types'
import { emptySiteConfig } from '@/lib/site-config-types'

const SiteContext = createContext<SiteConfig>(emptySiteConfig)

export const useSiteConfig = () => useContext(SiteContext)

export function SiteRuntime({
  children,
}: {
  children: ReactNode
}) {
  const [config, setConfig] = useState<SiteConfig>(emptySiteConfig)

  // فقط یک‌بار در mount — وابسته به مسیر نیست
  useEffect(() => {
    fetch('/api/site-config', {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setConfig(d.data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const root = document.documentElement

    root.style.setProperty('--site-primary', config.theme.primary)
    root.style.setProperty('--site-secondary', config.theme.secondary)
    root.style.setProperty('--site-accent', config.theme.accent)
    root.style.setProperty('--site-background', config.theme.background)
    root.style.setProperty('--site-foreground', config.theme.foreground)
    root.style.setProperty('--site-muted', config.theme.muted)
    root.style.setProperty('--site-radius', config.theme.radius)
    root.style.setProperty('--site-font', config.theme.font)

    document.title =
      config.seo.title ||
      config.brand.nameFa ||
      document.title
  }, [config])

  return (
    <SiteContext.Provider value={config}>
      {children}
    </SiteContext.Provider>
  )
}