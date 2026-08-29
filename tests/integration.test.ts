import { describe, expect, it } from 'vitest'

import { mergeConfig, DEFAULT_SITE_CONFIG } from '@/lib/site-config-defaults'

describe('site config merge', () => {
  it('keeps the default home blocks until the admin saves a page', () => {
    const merged = mergeConfig(DEFAULT_SITE_CONFIG, {})
    expect(merged.pages.home.blocks.length).toBeGreaterThan(0)
  })

  it('respects an intentionally empty home page', () => {
    const merged = mergeConfig(DEFAULT_SITE_CONFIG, {
      pages: { home: { slug: 'home', title: 'صفحه اصلی', published: true, blocks: [] } },
    } as never)

    expect(merged.pages.home.blocks).toEqual([])
  })

  it('merges brand fields over the defaults', () => {
    const merged = mergeConfig(DEFAULT_SITE_CONFIG, {
      brand: { nameFa: 'سنگ آرا' },
    } as never)

    expect(merged.brand.nameFa).toBe('سنگ آرا')
    expect(merged.brand.nameEn).toBe(DEFAULT_SITE_CONFIG.brand.nameEn)
  })
})
