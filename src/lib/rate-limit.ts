import Redis from 'ioredis'

const memory = new Map<string, { count: number; resetAt: number }>()
let redis: Redis | null = null

function getRedis() {
  if (!process.env.REDIS_URL) return null
  if (!redis) redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, enableOfflineQueue: false })
  return redis
}

export async function rateLimit(key: string, limit = 30, windowSeconds = 60) {
  const client = getRedis()
  if (client) {
    try {
      const bucket = `rl:${key}`
      const count = await client.incr(bucket)
      if (count === 1) await client.expire(bucket, windowSeconds)
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
    } catch { /* fallback below */ }
  }
  const now = Date.now(); const item = memory.get(key)
  if (!item || now >= item.resetAt) { memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 }); return { allowed: true, remaining: limit - 1 } }
  item.count += 1
  return { allowed: item.count <= limit, remaining: Math.max(0, limit - item.count) }
}
