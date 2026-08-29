import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * تستِ مستقیمِ رفتارِ مسیریابی (همان چیزی که باگِ «دکمه برگشت» از آن ناشی می‌شد)
 *
 * چون store از window استفاده می‌کند، قبل از import یک window ساختگی می‌سازیم.
 */

/**
 * ذخیره‌ساز ساختگی برای middleware ی persist زاستند
 */
const storage = new Map<string, string>()

const fakeLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, String(value))
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => storage.clear(),
  key: () => null,
  length: 0,
}

const pushState = vi.fn()
const replaceState = vi.fn()
const scrollTo = vi.fn()

const location = { pathname: '/', search: '' }

;(globalThis as Record<string, unknown>).localStorage = fakeLocalStorage
;(globalThis as Record<string, unknown>).window = {
  location,
  localStorage: fakeLocalStorage,
  history: { state: null, pushState, replaceState },
  scrollTo,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

const { useAppStore } = await import('@/store/app-store')

describe('router store', () => {
  beforeEach(() => {
    pushState.mockClear()
    replaceState.mockClear()
    location.pathname = '/'
    location.search = ''
    useAppStore.setState({ route: 'home', params: {} })
  })

  it('pushes a history entry when the route changes', () => {
    useAppStore.getState().navigate('catalog')

    expect(useAppStore.getState().route).toBe('catalog')
    expect(pushState).toHaveBeenCalledTimes(1)
    expect(pushState.mock.calls[0][2]).toBe('/?route=catalog')
  })

  it('replaces the entry when only params change', () => {
    useAppStore.setState({ route: 'catalog', params: {} })

    useAppStore.getState().navigate('catalog', { category: 'marble' })

    expect(replaceState).toHaveBeenCalledTimes(1)
    expect(replaceState.mock.calls[0][2]).toBe('/?route=catalog&category=marble')
    expect(pushState).not.toHaveBeenCalled()
  })

  it('keeps legacy product links working', () => {
    useAppStore.getState().navigate('product', { id: 'stone-1' })
    expect(pushState.mock.calls[0][2]).toBe('/?product=stone-1')
  })

  it('applies a location from the browser (back / forward)', () => {
    useAppStore.getState().applyLocation('http://localhost/?route=about')
    expect(useAppStore.getState().route).toBe('about')

    useAppStore.getState().applyLocation('http://localhost/?product=stone-9')
    expect(useAppStore.getState().route).toBe('product')
    expect(useAppStore.getState().params.id).toBe('stone-9')
  })

  it('ignores real Next.js paths', () => {
    useAppStore.setState({ route: 'home', params: {} })
    useAppStore.getState().applyLocation('http://localhost/p/persian-white')

    expect(useAppStore.getState().route).toBe('home')
  })
})
