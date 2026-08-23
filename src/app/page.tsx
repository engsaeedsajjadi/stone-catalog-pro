import { Suspense } from 'react'

import { HomePage } from '@/components/public/home-page'
import { LegacyDeepLinks } from '@/components/public/legacy-deep-links'

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <LegacyDeepLinks />
      </Suspense>

      <HomePage />
    </>
  )
}
