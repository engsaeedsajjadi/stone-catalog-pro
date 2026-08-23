export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/auth/me — دریافت اطلاعات کاربر فعلی
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  return NextResponse.json({ success: true, data: user })
}
