'use client'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

const ARGENTINA: [number, number] = [-38.4, -63.6]

// Marcador simple en CSS (evita problemas con los íconos por defecto de Leaflet en Next)
const pinIcon = () =>
  L.divIcon({
    className: '',
    html: '<div style="width:22px;height:22px;border-radius:50%;background:#14505C;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.55)"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })

/** Mapa para marcar la ubicación exacta: clic o arrastrar el punto. */
export default function LocationMap({ lat, lng, onPick }: { lat: string; lng: string; onPick: (lat: string, lng: string) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const fromMap = useRef(false) // true cuando el cambio vino de tocar el mapa (no hace falta recentrar)
  const pick = useRef(onPick)
  pick.current = onPick

  const fmt = (n: number) => n.toFixed(6)

  function place(la: number, lo: number) {
    if (!map.current) return
    if (marker.current) {
      marker.current.setLatLng([la, lo])
      return
    }
    const m = L.marker([la, lo], { draggable: true, icon: pinIcon(), keyboard: false }).addTo(map.current)
    m.on('dragend', () => {
      const p = m.getLatLng()
      fromMap.current = true
      pick.current(fmt(p.lat), fmt(p.lng))
    })
    marker.current = m
  }

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!el.current) return
    const la = parseFloat(lat)
    const lo = parseFloat(lng)
    const has = Number.isFinite(la) && Number.isFinite(lo)
    const m = L.map(el.current).setView(has ? [la, lo] : ARGENTINA, has ? 16 : 4)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => {
      fromMap.current = true
      place(e.latlng.lat, e.latlng.lng)
      pick.current(fmt(e.latlng.lat), fmt(e.latlng.lng))
    })
    map.current = m
    return () => {
      m.remove()
      map.current = null
      marker.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reflejar cambios hechos escribiendo las coordenadas o con "Ubicar por dirección"
  useEffect(() => {
    if (!map.current) return
    if (fromMap.current) {
      fromMap.current = false
      return
    }
    const la = parseFloat(lat)
    const lo = parseFloat(lng)
    if (Number.isFinite(la) && Number.isFinite(lo)) {
      place(la, lo)
      map.current.setView([la, lo], Math.max(map.current.getZoom(), 16))
    } else if (marker.current) {
      marker.current.remove()
      marker.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  return <div ref={el} className="h-72 w-full rounded-md border border-tinta/30" role="application" aria-label="Mapa para marcar la ubicación" />
}
