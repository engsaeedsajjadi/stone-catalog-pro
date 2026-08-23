export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

import { ProductDetailPage } from '@/components/public/product-detail-page'

export default async function ProductBySlug({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // `id` هم پذیرفته می‌شود چون بخش‌هایی از UI (مقایسه، حالت نمایشگاه) فقط id
  // محصول را در اختیار دارند و بدون این، لینکشان به 404 می‌خورد.
  const stone = await db.stone.findFirst({
    where: { OR: [{ slug }, { code: slug }, { id: slug }] },
    select: { id: true },
  })

  if (!stone) notFound()

  return <ProductDetailPage initialProductId={stone.id} />
}
