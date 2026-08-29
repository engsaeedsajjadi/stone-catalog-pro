export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { graphql, buildSchema } from 'graphql'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

const schema = buildSchema(`
  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
  }

  type Stone {
    id: ID!
    name: String!
    code: String!
    slug: String
    color: String
    quarry: String
    category: Category
  }

  type Query {
    stones(search: String, limit: Int): [Stone!]!
    categories: [Category!]!
  }
`)

const root = {
  stones: async ({ search, limit }: { search?: string; limit?: number }) =>
    db.stone.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { quarry: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      take: Math.min(limit || 24, 100),
      include: { category: true },
    }),

  categories: () =>
    db.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
}

export async function POST(req: NextRequest) {
  // احراز هویت الزامی
  const auth = await requireAuth(req)
  if ('response' in auth) return auth.response

  // محدودیت نرخ: ۳۰ درخواست در دقیقه
  const ip = getClientIp(req)
  const limited = await rateLimit(`graphql:${ip}`, 30, 60)
  if (!limited.allowed) {
    return NextResponse.json(
      { errors: [{ message: 'تعداد درخواست‌ها بیش از حد مجاز است' }] },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const out = await graphql({
      schema,
      source: String(body.query || ''),
      rootValue: root,
      variableValues: body.variables,
    })

    return NextResponse.json(out, {
      status: out.errors?.length ? 400 : 200,
    })
  } catch (e) {
    return NextResponse.json(
      { errors: [{ message: e instanceof Error ? e.message : 'GraphQL error' }] },
      { status: 400 }
    )
  }
}
