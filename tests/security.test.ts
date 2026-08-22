import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/security'

describe('password security', () => {
  it('hashes and verifies a password without storing plaintext', () => {
    const password = 'correct-horse-battery-staple'
    const hash = hashPassword(password)
    expect(hash).not.toContain(password)
    expect(verifyPassword(password, hash)).toBe(true)
    expect(verifyPassword('wrong-password', hash)).toBe(false)
  })
})
