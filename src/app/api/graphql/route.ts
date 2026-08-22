export const dynamic="force-dynamic";export const runtime="nodejs"
import {NextRequest,NextResponse} from 'next/server'
import {graphql,buildSchema} from 'graphql'
import {db} from '@/lib/db'
const schema=buildSchema(`type Category { id: ID!, name: String!, slug: String!, description: String } type Stone { id: ID!, name: String!, code: String!, slug: String, color: String, quarry: String, category: Category } type Query { stones(search:String,limit:Int): [Stone!]!, categories:[Category!]! }`)
const root={stones:async({search,limit}:{search?:string,limit?:number})=>db.stone.findMany({where:search?{OR:[{name:{contains:search,mode:'insensitive'}},{code:{contains:search,mode:'insensitive'}},{quarry:{contains:search,mode:'insensitive'}}]}:{},take:Math.min(limit||24,100),include:{category:true}}),categories:()=>db.category.findMany({where:{isActive:true},orderBy:{order:'asc'}})}
export async function POST(req:NextRequest){try{const body=await req.json();const out=await graphql({schema,source:String(body.query||''),rootValue:root,variableValues:body.variables});return NextResponse.json(out,{status:out.errors?.length?400:200})}catch(e){return NextResponse.json({errors:[{message:e instanceof Error?e.message:'GraphQL error'}]},{status:400})}}
