export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limited = await rateLimit(`contact:${ip}`, 10, 60)
    if (!limited.allowed) return NextResponse.json({ success:false,error:'تعداد درخواست‌ها بیش از حد مجاز است' }, { status:429 })
    const body=await req.json()
    const customerName=String(body.customerName||'').trim(); const customerPhone=String(body.customerPhone||'').trim(); const message=String(body.message||'').trim()
    if(!customerName || !customerPhone || !message) return NextResponse.json({success:false,error:'نام، تماس و پیام الزامی است'},{status:400})
    const inquiry=await db.inquiry.create({data:{customerName,customerPhone,customerEmail:body.customerEmail||null,inquiryType:'CONTACT',message,status:'NEW',priority:'MEDIUM'}})
    return NextResponse.json({success:true,data:{id:inquiry.id}},{status:201})
  } catch { return NextResponse.json({success:false,error:'ثبت پیام ناموفق بود'},{status:500}) }
}
