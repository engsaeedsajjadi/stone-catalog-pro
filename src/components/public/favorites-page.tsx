'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Loader2 } from 'lucide-react'

import { useAppStore } from '@/store/app-store'
import { ProductCard } from '@/components/stone/product-card'
import { Button } from '@/components/ui/button'

/**
 * قبلاً این صفحه فقط تعداد را نشان می‌داد و کاربر را به کاتالوگ حواله می‌کرد،
 * یعنی زدن قلب هیچ خروجی قابل دیدنی نداشت. الآن محصولات واقعی را می‌آورد.
 */
export function FavoritesPage() {
  const favorites = useAppStore(state => state.favorites)

  const [stones, setStones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ids = favorites.join(',')

  useEffect(() => {
    if (!ids) {
      setStones([])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()

    setLoading(true)
    setError(null)

    fetch(`/api/products/by-ids?ids=${encodeURIComponent(ids)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async response => {
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'دریافت علاقه‌مندی‌ها ناموفق بود')
        }
        return payload.data as any[]
      })
      .then(data => setStones(data || []))
      .catch(caught => {
        if (caught?.name === 'AbortError') return
        setStones([])
        setError(caught instanceof Error ? caught.message : 'خطای نامشخص')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [ids])

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
          <Heart className="w-12 h-12 text-muted-foreground" />
        </div>

        <h2 className="text-2xl font-bold mb-2">علاقه‌مندی‌های شما</h2>

        <p className="text-muted-foreground mb-6">
          هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید
        </p>

        <Button asChild>
          <Link href="/catalog">مشاهده کاتالوگ</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black mb-6">
        علاقه‌مندی‌های من ({favorites.length})
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="aspect-[3/4] rounded-2xl shimmer" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            تلاش دوباره
          </Button>
        </div>
      ) : stones.length === 0 ? (
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            محصولات علاقه‌مندی شما دیگر در دسترس نیستند.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {stones.map(stone => (
            <ProductCard key={stone.id} stone={stone} />
          ))}
        </div>
      )}
    </div>
  )
}
