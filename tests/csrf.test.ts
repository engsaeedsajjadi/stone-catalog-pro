import { describe, expect, it } from 'vitest'

import { isCsrfSafe } from '@/lib/csrf'

function request(method: string, headers: Record<string, string>) {
  return { method, headers: new Headers(headers) }
}

describe('csrf guard', () => {
  it('always allows safe methods', () => {
    expect(isCsrfSafe(request('GET', {}))).toBe(true)
    expect(isCsrfSafe(request('HEAD', {}))).toBe(true)
    expect(isCsrfSafe(request('OPTIONS', {}))).toBe(true)
  })

  it('accepts same-origin POST requests', () => {
    expect(
      isCsrfSafe(
        request('POST', { host: 'catalog.example.com', origin: 'https://catalog.example.com' })
      )
    ).toBe(true)
  })

  it('rejects cross-origin POST requests', () => {
    expect(
      isCsrfSafe(request('POST', { host: 'catalog.example.com', origin: 'https://evil.example.com' }))
    ).toBe(false)
  })

  it('rejects requests without origin or referer', () => {
    expect(isCsrfSafe(request('POST', { host: 'catalog.example.com' }))).toBe(false)
  })

  it('falls back to referer when origin is missing', () => {
    expect(
      isCsrfSafe(
        request('DELETE', { host: 'catalog.example.com', referer: 'https://catalog.example.com/admin' })
      )
    ).toBe(true)
  })
})
