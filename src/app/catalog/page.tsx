import { Suspense } from 'react'

import { CatalogPage } from '@/components/public/catalog-page'

export default function CatalogRoute() {
  return (
    <Suspense fallback={null}>
      <CatalogPage />
    </Suspense>
  )
}
