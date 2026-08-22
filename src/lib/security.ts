import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const ACCESS_TTL_SECONDS = 15 * 60
const REFRESH_TTL_DAYS = 30

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`
}

export function verifyPassword(password: string, encoded: string) {
  const [algo, saltB64, hashB64] = encoded.split('$')
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false
  const salt = Buffer.from(saltB64, 'base64url')
  const expected = Buffer.from(hashB64, 'base64url')
  const actual = scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1 })
  return timingSafeEqual(actual, expected)
}

function signJwt(payload: Record<string, unknown>) {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters')
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

export function issueAccessToken(user: { id: string; email: string; role: string; name: string }) {
  const now = Math.floor(Date.now() / 1000)
  return signJwt({ sub: user.id, email: user.email, role: user.role, name: user.name, iat: now, exp: now + ACCESS_TTL_SECONDS })
}

export function issueRefreshToken() {
  return randomBytes(48).toString('base64url')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000

export function verifyAccessToken(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, signature] = parts
  try {
    const secret = process.env.JWT_SECRET
    if (!secret || secret.length < 32) return null
    const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload as { sub: string; email: string; role: string; name: string; exp: number; iat: number }
  } catch {
    return null
  }
}
