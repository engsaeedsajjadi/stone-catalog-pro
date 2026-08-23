export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.any(),
      })
    )
    .min(1),
})

/**
 * POST /api/ai/chat — چت با AI (با احراز هویت و محدودیت نرخ)
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('response' in auth) return auth.response

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limited = await rateLimit(`ai-chat:${ip}`, 20, 60)
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
      { status: 429 }
    )
  }

  try {
    const parsed = chatSchema.parse(await req.json())
    const reply = await aiChat(parsed.messages)

    return NextResponse.json({ success: true, data: { reply } })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'سرویس AI تنظیم نشده است' },
      { status: 503 }
    )
  }
}
