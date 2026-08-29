import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest { return { name: 'Stone Catalog', short_name: 'Stone Catalog', description: 'Digital stone catalog platform', start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#111827', icons: [{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'}] } }
