'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * مرز خطای سطح صفحه
 *
 * خطاهای غیرمنتظره‌ی سمت کلاینت را می‌گیرد تا کل سایت سفید نشود.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <Card className="w-full max-w-md gap-0 p-10 text-center">
        <h1 className="text-2xl font-black">مشکلی پیش آمد</h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          هنگام نمایش این صفحه خطایی رخ داد. دوباره تلاش کنید؛ در صورت تکرار،
          با پشتیبانی سایت تماس بگیرید.
        </p>

        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground" dir="ltr">
            کد خطا: {error.digest}
          </p>
        )}

        <Button
          onClick={reset}
          className="mt-8 rounded-none px-7 py-6 font-bold text-[#17130d]"
          style={{ background: '#d6b66a' }}
        >
          تلاش مجدد
        </Button>
      </Card>
    </div>
  )
}
