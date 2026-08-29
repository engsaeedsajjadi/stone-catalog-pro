import 'server-only'
import { Prisma, PrismaClient } from '@prisma/client'

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

let cachedModelAccessors: Set<string> | null = null

function modelAccessorNames(): Set<string> {
  if (cachedModelAccessors) return cachedModelAccessors

  const dmmf = (Prisma as unknown as {
    dmmf?: { datamodel?: { models?: Array<{ name: string }> } }
  }).dmmf

  const models = dmmf?.datamodel?.models ?? []

  cachedModelAccessors = new Set(
    models.map((model) => model.name.charAt(0).toLowerCase() + model.name.slice(1))
  )

  return cachedModelAccessors
}

function withClient<T>(fallback: T, operation: (client: PrismaClient) => T): T {
  try {
    return operation(getClient())
  } catch {
    return fallback
  }
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient()
    const value = Reflect.get(client, property, client) as unknown
    return typeof value === 'function' ? value.bind(client) : value
  },

  set(_target, property, value) {
    return withClient(false, (client) => Reflect.set(client, property, value))
  },

  has(_target, property) {
    if (typeof property !== 'string') return false
    if (property.startsWith('$') || property.startsWith('_')) return true
    if (modelAccessorNames().has(property)) return true
    return withClient(false, (client) => Reflect.has(client, property))
  },

  deleteProperty(_target, property) {
    return withClient(false, (client) => Reflect.deleteProperty(client, property))
  },

  ownKeys() {
    return withClient<Array<string | symbol>>([], (client) => Reflect.ownKeys(client))
  },

  getOwnPropertyDescriptor(_target, property) {
    return withClient(undefined, (client) =>
      Reflect.getOwnPropertyDescriptor(client, property)
    )
  },

  getPrototypeOf() {
    return withClient(Reflect.getPrototypeOf({}), (client) => Reflect.getPrototypeOf(client))
  },
})
