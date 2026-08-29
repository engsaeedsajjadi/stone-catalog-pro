import { describe, expect, it } from 'vitest'

import { rateLimit } from '@/lib/rate-limit'

describe('in-memory rate limiter', () => {
  it('allows up to the limit then blocks', async () => {
    const key = `test-${Math.random()}`

    for (let i = 0; i < 3; i++) {
      const result = await rateLimit(key, 3, 60)
      expect(result.allowed).toBe(true)
    }

    expect((await rateLimit(key, 3, 60)).allowed).toBe(false)
  })

  it('uses independent buckets per key', async () => {
    const a = `test-a-${Math.random()}`
    const b = `test-b-${Math.random()}`

    await rateLimit(a, 1, 60)
    expect((await rateLimit(a, 1, 60)).allowed).toBe(false)
    expect((await rateLimit(b, 1, 60)).allowed).toBe(true)
  })
})
