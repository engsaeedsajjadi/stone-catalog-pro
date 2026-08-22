import { db } from '@/lib/db'
export async function searchStones(query: string, limit=24){
 const url=process.env.MEILI_URL?.trim(); const key=process.env.MEILI_MASTER_KEY?.trim()
 if(url){ const r=await fetch(`${url.replace(/\/$/,"")}/indexes/stones/search`,{method:"POST",headers:{"Content-Type":"application/json",...(key?{"Authorization":`Bearer ${key}`}:{})},body:JSON.stringify({q:query,limit})}); if(r.ok){const d=await r.json();return {mode:"meilisearch",hits:d.hits||[]}} }
 const stones=await db.stone.findMany({where:{OR:[{name:{contains:query,mode:"insensitive"}},{code:{contains:query,mode:"insensitive"}},{quarry:{contains:query,mode:"insensitive"}},{color:{contains:query,mode:"insensitive"}},{tags:{contains:query,mode:"insensitive"}}]},take:limit,include:{category:true,images:{take:1,orderBy:{order:"asc"}},prices:true,inventory:true}})
 return {mode:"database",hits:stones}
}
