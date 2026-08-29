import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/security'

describe('password security', () => {
  it('hashes and verifies a password without storing plaintext', async () => {
    const password = 'correct-horse-battery-staple'
    const hash = await hashPassword(password)
    expect(hash).not.toContain(password)
    await expect(verifyPassword(password, hash)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
  })
})
