import type { Metadata } from 'next'
import { Suspense } from 'react'
import { WhatsAppFab } from '@/components/public/whatsapp-fab'
import { getLocationRows, getPublicSettings, searchProperties } from '@/lib/public-data'
import { parseFilters } from '@/lib/search-params'
import { GENERIC_MESSAGE, whatsappUrl } from '@/lib/whatsapp'
import { ListingFromUrl, ListingView } from './listing'

// Página estática: se genera en el build y se regenera cada minuto o al instante cuando se edita desde el panel
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Propiedades',
  description: 'Propiedades: casas, departamentos, terrenos, locales, oficinas y cocheras. Filtrá por ubicación, precio y características.',
  alternates: { canonical: '/propiedades' },
}

export default async function ListingPage() {
  const s = await getPublicSettings()
  const [initial, locations] = await Promise.all([searchProperties(parseFilters({}), s.default_currency), getLocationRows()])
  const props = { initial, locations, defaultCurrency: s.default_currency, whatsappNumber: s.whatsapp_number }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* El HTML estático trae el listado general (lo ven buscadores y la primera carga); los filtros se aplican en el navegador */}
      <Suspense fallback={<ListingView {...props} result={initial} />}>
        <ListingFromUrl {...props} />
      </Suspense>
      <WhatsAppFab href={whatsappUrl(s.whatsapp_number, GENERIC_MESSAGE)} />
    </div>
  )
}
