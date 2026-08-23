import { db } from '@/lib/db'

/**
 * جستجوی سنگ‌ها با Meilisearch یا fallback به دیتابیس
 */
export async function searchStones(query: string, limit = 24) {
  const url = process.env.MEILI_URL?.trim()
  const key = process.env.MEILI_MASTER_KEY?.trim()

  // استفاده از Meilisearch اگر تنظیم شده باشد
  if (url) {
    const response = await fetch(
      `${url.replace(/\/$/, '')}/indexes/stones/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { Authorization: `Bearer ${key}` } : {}),
        },
        body: JSON.stringify({ q: query, limit }),
      }
    )

    if (response.ok) {
      const data = await response.json()
      return { mode: 'meilisearch', hits: data.hits || [] }
    }
  }

  // Fallback: جستجو در دیتابیس
  const stones = await db.stone.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
        { quarry: { contains: query, mode: 'insensitive' } },
        { color: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    include: {
      category: true,
      images: { take: 1, orderBy: { order: 'asc' } },
      prices: true,
      inventory: true,
    },
  })

  return { mode: 'database', hits: stones }
}
