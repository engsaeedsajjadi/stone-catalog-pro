import type { NextConfig } from 'next'

/**
 * هدرهای امنیتی سراسری
 *
 * CSP در حالت توسعه آزادانه‌تر است چون نکست به eval نیاز دارد.
 */
function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV !== 'production'

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ]

  return directives.join('; ')
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  reactStrictMode: true,

  // عدم افشای فناوری سمت سرور
  poweredByHeader: false,

  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  images: {
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
