'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useRouter } from 'next/navigation'
import { useSiteConfig } from '@/components/public/site-runtime'
import { Sparkles, Phone, Mail, MapPin, Clock, Instagram, Send, Youtube, Linkedin, MessageCircle } from 'lucide-react'

export function Footer(){
  const router = useRouter()
  const {navigate,t}=useAppStore(); const site=useSiteConfig(); const [settings,setSettings]=useState<Record<string,string>>({})
  useEffect(()=>{fetch('/api/settings/public').then(r=>r.json()).then(d=>setSettings(d.data||{})).catch(()=>{})},[])
  const phone=site.brand.phone || settings['company.phone']; const email=site.brand.email || settings['company.email']; const address=site.brand.address || settings['company.address']
  const workingHours=site.brand.workingHours || settings['company.workingHours']

  const socials=[
    { key:'instagram', href:site.brand.instagram, Icon:Instagram, label:'اینستاگرام' },
    { key:'telegram', href:site.brand.telegram, Icon:Send, label:'تلگرام' },
    { key:'whatsapp', href:site.brand.whatsapp, Icon:MessageCircle, label:'واتساپ' },
    { key:'youtube', href:site.brand.youtube, Icon:Youtube, label:'یوتیوب' },
    { key:'linkedin', href:site.brand.linkedin, Icon:Linkedin, label:'لینکدین' },
  ].filter(item=>item.href) as Array<{ key:string; href:string; Icon:typeof Instagram; label:string }>
  return <footer className="mt-auto bg-brand-950 text-brand-50"><div className="h-1 bg-gold"/><div className="container mx-auto px-4 py-14"><div className="grid md:grid-cols-3 gap-10"><div><div className="flex items-center gap-3 mb-4"><div className="w-11 h-11 rounded-xl bg-gold flex items-center justify-center"><Sparkles className="w-5 h-5 text-brand-950"/></div><div><div className="font-bold">{site.brand.nameFa || site.brand.nameEn || ""}</div><div className="text-xs text-brand-300">{site.brand.taglineFa || site.brand.taglineEn || ""}</div></div></div><p className="text-sm text-brand-300">{site.footer.text || ""}</p></div><div><h4 className="font-bold text-gold mb-4">دسترسی سریع</h4><div className="space-y-2 text-sm text-brand-300">{[['home','nav.home'],['catalog','nav.catalog'],['about','nav.about'],['contact','nav.contact']].map(([r,l])=><button key={r} className="block hover:text-gold" onClick={()=>{ if(r==='home') router.push('/'); else if(r==='catalog') router.push('/catalog'); else navigate(r) }}>{t(l)}</button>)}</div></div><div><h4 className="font-bold text-gold mb-4">اطلاعات تماس</h4><div className="space-y-3 text-sm text-brand-300">{phone&&<div className="flex gap-3"><Phone className="w-4 h-4 text-gold"/><span dir="ltr">{phone}</span></div>}{email&&<div className="flex gap-3"><Mail className="w-4 h-4 text-gold"/><span dir="ltr">{email}</span></div>}{address&&<div className="flex gap-3"><MapPin className="w-4 h-4 text-gold"/><span>{address}</span></div>}{workingHours&&<div className="flex gap-3"><Clock className="w-4 h-4 text-gold"/><span>{workingHours}</span></div>}{!phone&&!email&&!address&&<p>اطلاعات تماس در پنل مدیریت تنظیم نشده است.</p>}</div></div></div><div className="mt-10 pt-5 border-t border-brand-800 text-xs text-brand-400 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div>© {new Date().getFullYear()} {site.brand.nameFa || site.brand.nameEn || ""} {site.footer.copyright || ""}</div>{socials.length>0&&<div className="flex items-center gap-3">{socials.map(({key,href,Icon,label})=><a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-9 h-9 rounded-full border border-brand-800 flex items-center justify-center text-brand-300 hover:text-gold hover:border-gold transition-colors"><Icon className="w-4 h-4"/></a>)}</div>}</div></div></footer>
}
