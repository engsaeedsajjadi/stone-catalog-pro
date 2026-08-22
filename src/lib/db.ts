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

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  datasources: { db: { url: getDatabaseUrl() } },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
