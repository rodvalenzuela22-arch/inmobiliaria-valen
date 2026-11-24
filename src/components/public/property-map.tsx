'use client'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

/** Mapa de solo lectura con el punto exacto de la propiedad. */
export default function PropertyMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!el.current) return
    const map = L.map(el.current, {
      scrollWheelZoom: false, // no "atrapa" el scroll de la página
      dragging: !L.Browser.mobile,
    }).setView([lat, lng], 16)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    L.marker([lat, lng], {
      keyboard: false,
      icon: L.divIcon({
        className: '',
        html: '<div style="width:24px;height:24px;border-radius:50%;background:rgb(var(--c-primary));border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.55)"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    }).addTo(map)
    return () => { map.remove() }
  }, [lat, lng])

  return <div ref={el} className="h-72 w-full rounded-lg border border-arena" role="img" aria-label={`Mapa con la ubicación de ${label}`} />
}
