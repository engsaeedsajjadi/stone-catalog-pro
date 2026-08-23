export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const syncSchema = z.object({
  type: z.string().default('SYNC'),
  recordType: z.string().default(''),
  recordId: z.string().default(''),
  payload: z.any().optional(),
})

/**
 * POST /api/erp/sync — همگام‌سازی با ERP
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response

  // محدودیت نرخ
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limited = await rateLimit(`erp-sync:${ip}`, 10, 60)
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' },
      { status: 429 }
    )
  }

  const endpoint = process.env.ERP_BASE_URL
  const token = process.env.ERP_API_TOKEN

  if (!endpoint || !token) {
    return NextResponse.json(
      { success: false, error: 'ERP تنظیم نشده است' },
      { status: 503 }
    )
  }

  try {
    const body = syncSchema.parse(await req.json())

    const response = await fetch(`${endpoint.replace(/\/$/, '')}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()

    await db.erpLog.create({
      data: {
        syncType: body.type,
        recordType: body.recordType,
        recordId: body.recordId,
        status: response.ok ? 'SUCCESS' : 'FAILED',
        payload: JSON.stringify(body),
        response: responseText,
        syncedAt: response.ok ? new Date() : undefined,
        errorMessage: response.ok ? undefined : responseText,
      },
    })

    return NextResponse.json(
      { success: response.ok, data: responseText },
      { status: response.ok ? 200 : 502 }
    )
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'همگام‌سازی ERP ناموفق بود' },
      { status: 502 }
    )
  }
}
