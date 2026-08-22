export const dynamic="force-dynamic";export const runtime="nodejs"
import {NextRequest,NextResponse} from 'next/server';import {searchStones} from '@/lib/search'
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams.get('q')?.trim();if(!q)return NextResponse.json({success:true,data:[],mode:'database'});try{const out=await searchStones(q,Number(req.nextUrl.searchParams.get('limit')||24));return NextResponse.json({success:true,data:out.hits,mode:out.mode})}catch(e){return NextResponse.json({success:false,error:e instanceof Error?e.message:'Search failed'},{status:500})}}
