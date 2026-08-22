export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getSiteConfig, saveSiteConfig, type SiteConfig } from '@/lib/site-config'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try { return NextResponse.json({ success:true, data: await getSiteConfig() }) }
  catch (e) { return NextResponse.json({success:false,error:e instanceof Error?e.message:'Failed to load site configuration'},{status:500}) }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req,['ADMIN'])
  if ('response' in auth) return auth.response
  try {
    const body = await req.json() as SiteConfig
    if (!body || typeof body !== 'object') return NextResponse.json({success:false,error:'پیکربندی نامعتبر است'},{status:400})
    await saveSiteConfig(body)
    return NextResponse.json({success:true,data:body})
  } catch(e) { return NextResponse.json({success:false,error:e instanceof Error?e.message:'Failed to save site configuration'},{status:400}) }
}
