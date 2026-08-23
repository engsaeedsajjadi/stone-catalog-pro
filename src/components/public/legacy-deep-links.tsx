'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * لینک‌های قدیمی `/?product=<id>` و `/?q=<term>` را به مسیرهای واقعی
 * ریدایرکت می‌کند تا QR کدها و لینک‌های منتشرشده‌ی قبلی نشکنند.
 */
export function LegacyDeepLinks() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const product = searchParams.get('product')
    if (product) {
      router.replace(`/p/${encodeURIComponent(product)}`)
      return
    }

    const query = searchParams.get('q')
    if (query) {
      router.replace(`/catalog?q=${encodeURIComponent(query)}`)
    }
  }, [searchParams, router])

  return null
}
