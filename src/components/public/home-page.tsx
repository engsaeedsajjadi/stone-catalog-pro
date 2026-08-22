"use client"
import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useSiteConfig } from '@/components/public/site-runtime'
import type { SiteBlock } from '@/lib/site-config'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/components/stone/product-card'
import { ArrowLeft, Search, Package, Star } from 'lucide-react'

type Stone = Record<string, any>

export function HomePage(){
  const {navigate,t} = useAppStore(); const config=useSiteConfig();
  const [data,setData]=useState<Record<string,any[]>>({}); const [q,setQ]=useState(''); const [loading,setLoading]=useState(true)
  const page=config.pages.home
  useEffect(()=>{
    const tasks=[
      ['featured','/api/products?featured=true&pageSize=8'],['newest','/api/products?newest=true&pageSize=8'],['bestseller','/api/products?bestseller=true&pageSize=8'],['export','/api/products?export=true&pageSize=8'],['categories','/api/categories']
    ] as const
    Promise.all(tasks.map(async ([key,url])=>{ const r=await fetch(url,{cache:'no-store'}); const d=await r.json(); return [key,d.data||[]] as const })).then(rows=>setData(Object.fromEntries(rows))).finally(()=>setLoading(false))
  },[])
  const blocks=useMemo(()=>page?.blocks ?? [],[page])
  const search=(e:React.FormEvent)=>{e.preventDefault();navigate('catalog',{q:q.trim()})}
  if(!page || blocks.length===0){
    return <div className="container mx-auto px-4 py-16"><Card className="p-10 text-center border-dashed"><Package className="mx-auto w-12 h-12 mb-4 text-muted-foreground"/><h1 className="text-3xl font-black mb-3">صفحه اصلی هنوز طراحی نشده است</h1><p className="text-muted-foreground">مدیر سایت می‌تواند بدون کدنویسی محتوای صفحه را از پنل مدیریت طراحی و منتشر کند.</p></Card></div>
  }
  return <div className="flex flex-col">{blocks.filter(b=>b.enabled).map(block=><Block key={block.id} block={block} data={data} loading={loading} q={q} setQ={setQ} search={search} navigate={navigate} t={t}/>)}</div>
}

function Block({block,data,loading,q,setQ,search,navigate,t}:{block:SiteBlock,data:Record<string,any[]>,loading:boolean,q:string,setQ:(v:string)=>void,search:(e:React.FormEvent)=>void,navigate:(r:string,p?:Record<string,string>)=>void,t:(k:string)=>string}){
 const d=block.data||{}
 const products=Array.isArray(data[d.source as string])?data[d.source as string]:[]
 if(block.type==='hero') return <section className="relative overflow-hidden py-24 md:py-32 text-white" style={{background:d.backgroundImage?`linear-gradient(rgba(0,0,0,.48),rgba(0,0,0,.52)),url(${d.backgroundImage})`:`linear-gradient(135deg,var(--site-secondary),var(--site-primary))`,backgroundSize:'cover',backgroundPosition:'center'}}><div className="container mx-auto px-4"><div className="max-w-4xl"><Badge className="mb-5" style={{backgroundColor:`color-mix(in srgb,var(--site-accent) 25%,transparent)`,color:'var(--site-accent)'}}>{block.subtitle || ' '}</Badge><h1 className="text-4xl md:text-6xl font-black leading-tight mb-5">{block.title}</h1><p className="text-lg md:text-xl text-white/80 max-w-3xl leading-relaxed">{(d.body as string)||''}</p>{d.showSearch!==false&&<form onSubmit={search} className="mt-8 max-w-2xl rounded-2xl bg-white/10 backdrop-blur-md p-2 flex gap-2"><Input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search.placeholder')} className="bg-white text-slate-900 border-0 h-12"/><Button type="submit" className="h-12 px-6" style={{background:'var(--site-accent)',color:'var(--site-secondary)'}}><Search className="w-5 h-5 ml-2"/>{t('common.search')}</Button></form>}</div></div></section>
 if(block.type==='richtext') return <section className="py-16"><div className="container mx-auto px-4 max-w-4xl"><Badge variant="outline" className="mb-3">{(d.eyebrow as string)||''}</Badge><h2 className="text-3xl md:text-4xl font-black mb-5">{block.title}</h2><div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap leading-8 text-muted-foreground">{(d.body as string)||''}</div></div></section>
 if(block.type==='image-text') return <section className="py-16"><div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">{block.imageUrl?<img src={block.imageUrl} alt={block.title||''} className="w-full aspect-[4/3] rounded-3xl object-cover"/>:<div className="aspect-[4/3] rounded-3xl bg-muted"/>}<div><Badge variant="outline" className="mb-3">{(d.eyebrow as string)||''}</Badge><h2 className="text-3xl md:text-4xl font-black mb-5">{block.title}</h2><p className="leading-8 text-muted-foreground whitespace-pre-wrap">{(d.body as string)||''}</p>{d.ctaLabel&&<Button className="mt-6" onClick={()=>navigate(String(d.ctaRoute||'catalog'))}>{String(d.ctaLabel)}<ArrowLeft className="w-4 h-4 mr-2"/></Button>}</div></div></section>
 if(block.type==='products') return <section className="py-16" style={{background:d.alt?`var(--site-muted)`:'var(--site-background)'}}><div className="container mx-auto px-4"><div className="flex items-end justify-between mb-8"><div><Badge variant="outline" className="mb-3"><Star className="w-3.5 h-3.5 ml-1.5"/>{block.subtitle||''}</Badge><h2 className="text-3xl font-black">{block.title}</h2></div><Button variant="ghost" onClick={()=>navigate('catalog')}>مشاهده همه<ArrowLeft className="w-4 h-4 mr-2"/></Button></div>{loading?<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="aspect-[3/4] rounded-2xl shimmer"/>)}</div>:<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.map((s:Stone)=><ProductCard key={s.id} stone={s}/>)}</div>}</div></section>
 if(block.type==='categories') return <section className="py-16" style={{background:'var(--site-muted)'}}><div className="container mx-auto px-4"><h2 className="text-3xl font-black mb-8">{block.title}</h2><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{(data.categories||[]).map((cat:any)=><button key={cat.id} onClick={()=>navigate('catalog',{category:cat.slug})} className="rounded-2xl border bg-card p-5 text-right hover:-translate-y-1 hover:shadow-lg transition"><div className="font-bold">{cat.name}</div><div className="text-xs text-muted-foreground mt-1">{cat._count?.stones || 0}</div></button>)}</div></div></section>
 if(block.type==='features') return <section className="py-14"><div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.isArray(d.items)&&d.items.map((it:any,i:number)=><Card key={i} className="p-6"><div className="font-bold mb-2">{it.title}</div><p className="text-sm text-muted-foreground leading-7">{it.body}</p></Card>)}</div></section>
 if(block.type==='stats') return <section className="py-14"><div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">{Array.isArray(d.items)&&d.items.map((it:any,i:number)=><Card key={i} className="p-6 text-center"><div className="text-3xl font-black" style={{color:'var(--site-primary)'}}>{it.value}</div><div className="text-sm text-muted-foreground mt-2">{it.label}</div></Card>)}</div></section>
 if(block.type==='gallery') return <section className="py-16"><div className="container mx-auto px-4"><h2 className="text-3xl font-black mb-8">{block.title}</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.isArray(d.images)&&d.images.map((src:string,i:number)=><img key={i} src={src} alt={String(block.title||'')} className="w-full aspect-square object-cover rounded-2xl"/>)}</div></div></section>
 if(block.type==='testimonials') return <section className="py-16" style={{background:'var(--site-muted)'}}><div className="container mx-auto px-4"><h2 className="text-3xl font-black mb-8">{block.title}</h2><div className="grid md:grid-cols-3 gap-5">{Array.isArray(d.items)&&d.items.map((it:any,i:number)=><Card key={i} className="p-6"><p className="leading-8 mb-4">{it.quote}</p><div className="font-bold">{it.name}</div><div className="text-xs text-muted-foreground">{it.company}</div></Card>)}</div></div></section>
 if(block.type==='cta') return <section className="py-20 text-white" style={{background:'linear-gradient(135deg,var(--site-secondary),var(--site-primary))'}}><div className="container mx-auto px-4 text-center max-w-3xl"><h2 className="text-3xl md:text-5xl font-black mb-5">{block.title}</h2><p className="text-white/75 leading-8 mb-8">{(d.body as string)||''}</p>{d.ctaLabel&&<Button size="lg" onClick={()=>navigate(String(d.ctaRoute||'contact'))} style={{background:'var(--site-accent)',color:'var(--site-secondary)'}}>{String(d.ctaLabel)}</Button>}</div></section>
 return <div className="h-8"/>
}
