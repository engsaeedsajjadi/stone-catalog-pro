import { describe, expect, it } from 'vitest'

import { buildAppUrl, parseAppLocation, sameParams } from '@/lib/app-url'

describe('app-url', () => {
  it('builds legacy-compatible product links', () => {
    expect(buildAppUrl('product', { id: 'abc123' })).toBe('/?product=abc123')
  })

  it('keeps the root clean for home', () => {
    expect(buildAppUrl('home')).toBe('/')
  })

  it('encodes other routes and params', () => {
    expect(buildAppUrl('catalog', { category: 'marble' })).toBe('/?route=catalog&category=marble')
    expect(buildAppUrl('about')).toBe('/?route=about')
  })

  it('round-trips every route through the parser', () => {
    const cases: Array<[string, Record<string, string>]> = [
      ['home', {}],
      ['catalog', { category: 'travertine' }],
      ['about', {}],
      ['contact', {}],
      ['product', { id: 'stone-1' }],
    ]

    for (const [route, params] of cases) {
      const href = buildAppUrl(route, params)
      const parsed = parseAppLocation(`http://localhost${href}`)

      expect(parsed).not.toBeNull()
      expect(parsed?.route).toBe(route)
      expect(parsed?.params).toEqual(params)
    }
  })

  it('leaves real Next.js paths untouched', () => {
    expect(parseAppLocation('http://localhost/p/persian-white-marble')).toBeNull()
  })

  it('maps /catalog to the catalog route with its filters', () => {
    const parsed = parseAppLocation('http://localhost/catalog?category=marble')
    expect(parsed).toEqual({ route: 'catalog', params: { category: 'marble' } })
  })

  it('compares params by value', () => {
    expect(sameParams({ a: '1' }, { a: '1' })).toBe(true)
    expect(sameParams({ a: '1' }, { a: '2' })).toBe(false)
    expect(sameParams({ a: '1' }, { a: '1', b: '2' })).toBe(false)
  })
})
