import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <Card className="w-full max-w-md gap-0 p-10 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#d6b66a]/40 bg-[#1b1814]">
          <Sparkles className="h-6 w-6 text-[#d6b66a]" />
        </div>

        <div className="text-5xl font-black text-[#d6b66a]">۴۰۴</div>

        <h1 className="mt-4 text-xl font-bold">صفحه مورد نظر پیدا نشد</h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          آدرسی که وارد کرده‌اید وجود ندارد یا حذف شده است.
        </p>

        <Button asChild className="mt-8 rounded-none px-7 py-6 font-bold text-[#17130d]" style={{ background: '#d6b66a' }}>
          <Link href="/">بازگشت به صفحه اصلی</Link>
        </Button>
      </Card>
    </div>
  )
}
