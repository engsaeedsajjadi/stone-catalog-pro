'use client'

import { useMemo } from 'react'

import { useSiteConfig } from '@/components/public/site-runtime'
import { BlockRenderer } from '@/components/public/blocks/block-renderer'
import { getDefaultHomeBlocks } from '@/lib/site-blocks'
import type { SiteBlock } from '@/lib/site-config-types'

/**
 * صفحه اصلی
 *
 * تمام محتوای این صفحه از «بلوک‌های» تعریف‌شده در بخش طراحی سایت
 * ساخته می‌شود. اگر مدیر سایت هنوز بلوکی نساخته باشد، مجموعه‌ی
 * پیش‌فرض (همان ساختار و ظاهر قالب) نمایش داده می‌شود تا صفحه خالی
 * نماند — و باز هم در طراح سایت قابل ویرایش خواهد بود.
 */
export function HomePage() {
  const config = useSiteConfig()

  const blocks = useMemo<SiteBlock[]>(() => {
    const homePage = config.pages?.home as { blocks?: unknown } | undefined
    const saved = homePage?.blocks

    if (Array.isArray(saved)) return saved as SiteBlock[]

    return getDefaultHomeBlocks() as SiteBlock[]
  }, [config])

  return <BlockRenderer blocks={blocks} />
}
