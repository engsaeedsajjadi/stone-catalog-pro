import 'server-only'
import { PrismaClient } from '@prisma/client'

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error('DATABASE_URL is required and must be a PostgreSQL connection string.')
  }
  if (!/^postgres(?:ql)?:\/\//i.test(url)) {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://')
  }
  return url
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    datasources: { db: { url: getDatabaseUrl() } },
  })
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient()
  }
  return globalForPrisma.prisma
}

/**
 * کلاینت پایگاه‌داده
 *
 * ساختِ کلاینت «تنبل» است: تا زمانی که واقعاً استفاده نشود،
 * اتصال برقرار نمی‌شود. این کار لازم است چون برخی ابزارها (مثل build
 * یا ابزارهای تحلیل) فقط ماژول‌ها را import می‌کنند و در آن زمان ممکن
 * است DATABASE_URL در دسترس نباشد — در حالی که قرار نیست هیچ کوئری‌ای
 * اجرا شود.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient()
    const value = Reflect.get(client, property) as unknown

    // متدهایی مثل $queryRaw باید به کلاینت واقعی متصل باشند
    return typeof value === 'function' ? value.bind(client) : value
  },
})
