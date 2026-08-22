export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { hashToken, issueAccessToken, issueRefreshToken, REFRESH_TTL_MS } from '@/lib/security'
import { setAuthCookies } from '@/lib/auth'

export async function POST() {
  const c = await cookies(); const refresh = c.get('stone_refresh')?.value
  if (!refresh) return NextResponse.json({ success:false, error:'Refresh token missing' }, { status:401 })
  const session=await db.session.findUnique({where:{tokenHash:hashToken(refresh)},include:{user:true}})
  if (!session || session.revokedAt || session.expiresAt < new Date() || !session.user.isActive) return NextResponse.json({success:false,error:'Refresh token expired'},{status:401})
  const nextRefresh=issueRefreshToken()
  await db.session.update({where:{id:session.id},data:{revokedAt:new Date()}})
  await db.session.create({data:{userId:session.userId,tokenHash:hashToken(nextRefresh),expiresAt:new Date(Date.now()+REFRESH_TTL_MS),userAgent:session.userAgent,ipAddress:session.ipAddress}})
  const response=NextResponse.json({success:true,data:{id:session.user.id,email:session.user.email,name:session.user.name,role:session.user.role,phone:session.user.phone}})
  await setAuthCookies(response,issueAccessToken(session.user),nextRefresh)
  return response
}
