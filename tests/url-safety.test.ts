import { describe, expect, it } from 'vitest'

import { checkSafeOutboundUrl } from '@/lib/url-safety'

describe('outbound url safety (SSRF)', () => {
  it('allows public https URLs', () => {
    expect(checkSafeOutboundUrl('https://example.com/hook').ok).toBe(true)
  })

  it('rejects non-http protocols', () => {
    const result = checkSafeOutboundUrl('file:///etc/passwd')
    expect(result.ok).toBe(false)
    expect(checkSafeOutboundUrl('gopher://example.com').ok).toBe(false)
  })

  it('blocks localhost and loopback', () => {
    expect(checkSafeOutboundUrl('http://localhost:3000/admin').ok).toBe(false)
    expect(checkSafeOutboundUrl('https://127.0.0.1/x').ok).toBe(false)
    expect(checkSafeOutboundUrl('https://[::1]/x').ok).toBe(false)
  })

  it('blocks private networks', () => {
    for (const url of [
      'https://10.0.0.5/x',
      'https://192.168.1.10/x',
      'https://172.16.0.1/x',
      'https://169.254.169.254/latest/meta-data',
    ]) {
      expect(checkSafeOutboundUrl(url).ok).toBe(false)
    }
  })

  it('rejects malformed input', () => {
    expect(checkSafeOutboundUrl('').ok).toBe(false)
    expect(checkSafeOutboundUrl(undefined).ok).toBe(false)
    expect(checkSafeOutboundUrl('not a url').ok).toBe(false)
  })
})
