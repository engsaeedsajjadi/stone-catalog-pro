import { describe, expect, it } from 'vitest'

import {
  getDefaultHomeBlocks,
  normalizeNumber,
  toRecordArray,
  toStringArray,
} from '@/lib/site-blocks'

describe('default home blocks', () => {
  it('ships an enabled, ordered block list', () => {
    const blocks = getDefaultHomeBlocks()

    expect(blocks.length).toBeGreaterThan(0)
    expect(blocks.every((block) => block.enabled)).toBe(true)
    expect(blocks.map((block) => block.order)).toEqual([...blocks].sort((a, b) => a.order - b.order).map((b) => b.order))
  })

  it('uses only supported block types', () => {
    const supported = new Set([
      'hero', 'richtext', 'image-text', 'products', 'categories',
      'features', 'stats', 'gallery', 'testimonials', 'cta', 'contact', 'spacer',
    ])

    for (const block of getDefaultHomeBlocks()) {
      expect(supported.has(block.type)).toBe(true)
    }
  })

  it('does not seed commercial placeholder content', () => {
    const serialized = JSON.stringify(getDefaultHomeBlocks())
    // هیچ نام/آمار تجاری ساختگی در پیش‌فرض‌ها وجود ندارد
    expect(serialized).not.toContain('برند ساختگی')
    expect(serialized).not.toContain('+۲۵۰')
  })
})

describe('block helpers', () => {
  it('coerces arrays safely', () => {
    expect(toStringArray(['a', 1, 'b'])).toEqual(['a', 'b'])
    expect(toStringArray(undefined)).toEqual([])
    expect(toRecordArray([{ a: 1 }, null, 'x'])).toEqual([{ a: 1 }])
  })

  it('clamps numbers', () => {
    expect(normalizeNumber('12', 6, 1, 24)).toBe(12)
    expect(normalizeNumber('999', 6, 1, 24)).toBe(24)
    expect(normalizeNumber('abc', 6, 1, 24)).toBe(6)
  })
})
