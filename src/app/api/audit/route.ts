export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/audit — لاگ‌های فعالیت (فقط ADMIN)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if ('response' in auth) return auth.response

  const take = Math.min(Number(req.nextUrl.searchParams.get('take') || 100), 500)

  const rows = await db.activityLog.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  return NextResponse.json({ success: true, data: rows })
}
