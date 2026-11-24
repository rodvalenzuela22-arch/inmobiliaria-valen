'use client'

import dynamic from 'next/dynamic'

// Leaflet necesita el navegador: se carga solo allí
const PropertyMap = dynamic(() => import('./property-map'), {
  ssr: false,
  loading: () => <div className="h-72 rounded-lg bg-arena/40" role="status" aria-label="Cargando mapa" />,
})

export function PropertyMapLoader(props: { lat: number; lng: number; label: string }) {
  return <PropertyMap {...props} />
}
