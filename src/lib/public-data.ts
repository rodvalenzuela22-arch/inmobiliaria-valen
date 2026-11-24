import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { searchTerms } from './search-terms'
import { parseReels, type Reel } from './reels'
import { publicUrl } from './storage'

/**
 * Cliente SIN sesión para el sitio público: siempre ve solo lo que ve cualquier visitante
 * (aunque quien navegue sea del equipo y tenga la sesión abierta).
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export type PublicSettings = {
  agency_name: string; logo_path: string | null; whatsapp_number: string | null; email: string | null
  phone: string | null; address: string | null; instagram_url: string | null; facebook_url: string | null
  tiktok_url: string | null; youtube_url: string | null; color_primary: string; color_accent: string; default_currency: 'ARS' | 'USD'
  reels: Reel[]
}

const FALLBACK: PublicSettings = {
  agency_name: 'Inmobiliaria', logo_path: null, whatsapp_number: null, email: null, phone: null, address: null,
  instagram_url: null, facebook_url: null, tiktok_url: null, youtube_url: null,
  color_primary: '#14505c', color_accent: '#d9a21b', default_currency: 'USD', reels: [],
}

// cache(): dentro de una misma visita, la consulta se hace una sola vez aunque la pidan varios componentes
export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const { data } = await createPublicClient().from('settings').select('*').eq('id', 1).single()
  // Si todavía no se ejecutó 004_reels.sql, la columna no existe y la lista queda vacía
  return { ...FALLBACK, ...(data ?? {}), reels: parseReels(data?.reels) } as PublicSettings
})

// ---------- Imágenes ----------
export type PublicImage = {
  id?: string; path_thumb: string; path_medium: string; path_large: string; path_og?: string | null
  width: number | null; height: number | null; is_cover: boolean; position: number
}
export const imgUrl = (path: string) => publicUrl('property-images', path)

/** Fotos ordenadas: la portada primero y luego por posición. */
export function orderedImages(images: PublicImage[] | null | undefined): PublicImage[] {
  return [...(images ?? [])].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
}

/** Ancho real aproximado de cada variante (para srcset). */
export function variantWidths(img: Pick<PublicImage, 'width' | 'height'>) {
  const w = img.width ?? 1800
  const h = img.height ?? 1200
  const max = Math.max(w, h)
  const at = (side: number) => Math.round(w * Math.min(1, side / max))
  return { thumb: at(400), medium: at(1000), large: w }
}

// ---------- Etiquetas ----------
export function statusBadge(status: string, operation: string): string | null {
  if (status === 'reservada') return 'Reservada'
  if (status === 'vendida_alquilada') return operation === 'venta' ? 'Vendida' : 'Alquilada'
  return null
}

export function priceText(price: number | null, currency: string, operation: string): string {
  if (price === null || price === undefined) return 'Consultar precio'
  const n = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Number(price))
  return `${currency} ${n}${operation === 'alquiler_temporario' ? ' / noche' : ''}`
}

// ---------- Consultas de propiedades ----------
export const CARD_SELECT =
  'id, slug, code, title, operation, type, status, price, currency, bedrooms, bathrooms, garage_spaces, area_total, area_covered, province, city, neighborhood, ' +
  'property_images(path_thumb, path_medium, path_large, width, height, is_cover, position)'

// El tipo de fila se define a mano porque el cliente no tiene tipos generados de la base
export type CardProperty = {
  id: string; slug: string; code: string; title: string; operation: string; type: string; status: string
  price: number | null; currency: string; bedrooms: number | null; bathrooms: number | null; garage_spaces: number
  area_total: number | null; area_covered: number | null; province: string; city: string; neighborhood: string | null
  property_images: PublicImage[]
}

export type Filters = {
  operacion?: string; tipo?: string; provincia?: string; ciudad?: string; barrio?: string
  moneda?: 'ARS' | 'USD'; precioMin?: number; precioMax?: number; dormitorios?: number; banos?: number
  q?: string; supMin?: number; supMax?: number; cochera: boolean; caracteristicas: string[]
  orden: 'recientes' | 'precio_asc' | 'precio_desc'; pagina: number
}

export const PAGE_SIZE = 12

export async function searchProperties(f: Filters, defaultCurrency: 'ARS' | 'USD') {
  let q = createPublicClient().from('properties').select(CARD_SELECT, { count: 'exact' })
  // Búsqueda por palabras (sin importar tildes ni mayúsculas): cada palabra debe aparecer en título, descripción, lugar, código, tipo o comodidades
  for (const w of searchTerms(f.q)) q = q.ilike('search_text', `%${w}%`)
  if (f.operacion) q = q.eq('operation', f.operacion)
  if (f.tipo) q = q.eq('type', f.tipo)
  if (f.provincia) q = q.eq('province', f.provincia)
  if (f.ciudad) q = q.eq('city', f.ciudad)
  if (f.barrio) q = q.eq('neighborhood', f.barrio)
  // Los precios en pesos y dólares no se mezclan: si hay rango de precio, se filtra por moneda
  if (f.precioMin !== undefined || f.precioMax !== undefined) {
    q = q.eq('currency', f.moneda ?? defaultCurrency)
    if (f.precioMin !== undefined) q = q.gte('price', f.precioMin)
    if (f.precioMax !== undefined) q = q.lte('price', f.precioMax)
  } else if (f.moneda) {
    q = q.eq('currency', f.moneda)
  }
  if (f.dormitorios !== undefined) q = q.gte('bedrooms', f.dormitorios)
  if (f.banos !== undefined) q = q.gte('bathrooms', f.banos)
  if (f.supMin !== undefined) q = q.gte('area_total', f.supMin)
  if (f.supMax !== undefined) q = q.lte('area_total', f.supMax)
  if (f.cochera) q = q.gte('garage_spaces', 1)
  if (f.caracteristicas.length) q = q.contains('features', f.caracteristicas)

  if (f.orden === 'recientes') {
    q = q.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
  } else {
    if (!f.moneda) q = q.order('currency') // al ordenar por precio sin elegir moneda, se agrupan por moneda
    q = q.order('price', { ascending: f.orden === 'precio_asc', nullsFirst: false })
  }
  const from = (f.pagina - 1) * PAGE_SIZE
  const { data, count, error } = await q.range(from, from + PAGE_SIZE - 1)
  return { rows: (data ?? []) as unknown as CardProperty[], count: count ?? 0, error: Boolean(error) }
}

/** Provincias, ciudades y barrios que realmente tienen propiedades visibles. */
export type LocationRow = { province: string; city: string; neighborhood: string | null }

export async function getLocationRows(): Promise<LocationRow[]> {
  const { data } = await createPublicClient().from('properties').select('province, city, neighborhood').limit(2000)
  // Se deduplican para que la página estática no cargue filas repetidas
  const seen = new Set<string>()
  return ((data ?? []) as LocationRow[]).filter((r) => {
    const k = `${r.province}|${r.city}|${r.neighborhood ?? ''}`
    return seen.has(k) ? false : (seen.add(k), true)
  })
}

export async function getLocationOptions() {
  return locationOptionsFrom(await getLocationRows())
}

export function locationOptionsFrom(rows: LocationRow[]) {
  const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => Boolean(x)))].sort((a, b) => a.localeCompare(b, 'es'))
  return {
    provinces: uniq(rows.map((r) => r.province)),
    citiesOf: (province?: string) => uniq(rows.filter((r) => !province || r.province === province).map((r) => r.city)),
    neighborhoodsOf: (city?: string, province?: string) =>
      uniq(rows.filter((r) => (!city || r.city === city) && (!province || r.province === province)).map((r) => r.neighborhood)),
  }
}

export async function getHomeProperties() {
  const supabase = createPublicClient()
  const base = () => supabase.from('properties').select(CARD_SELECT).eq('status', 'publicada')
  const [featured, latest] = await Promise.all([
    base().eq('featured', true).order('published_at', { ascending: false, nullsFirst: false }).limit(6),
    base().order('published_at', { ascending: false, nullsFirst: false }).limit(6),
  ])
  return { featured: (featured.data ?? []) as unknown as CardProperty[], latest: (latest.data ?? []) as unknown as CardProperty[] }
}

/** Columnas de la ficha completa (se evita traer el índice de búsqueda, que no hace falta). */
export const FULL_SELECT =
  'id, slug, code, title, description, operation, type, status, price, currency, bedrooms, bathrooms, garage_spaces, area_total, area_covered, ' +
  'features, province, city, neighborhood, address, latitude, longitude, video_url, published_at, updated_at, show_when_closed, ' +
  'property_images(id, path_thumb, path_medium, path_large, path_og, width, height, is_cover, position)'

export type FullProperty = CardProperty & {
  description: string; features: string[]; latitude: number | null; longitude: number | null; address: string | null
  video_url: string | null; published_at: string | null; updated_at: string; show_when_closed: boolean
  property_images: (PublicImage & { id: string })[]
}

export const getPropertyBySlug = cache(async (slug: string): Promise<FullProperty | null> => {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null
  const { data } = await createPublicClient()
    .from('properties')
    .select(FULL_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  return (data as unknown as FullProperty | null) ?? null
})

export async function getRelated(p: { id: string; operation: string; city: string }): Promise<CardProperty[]> {
  const { data } = await createPublicClient()
    .from('properties').select(CARD_SELECT)
    .eq('status', 'publicada').eq('operation', p.operation).eq('city', p.city).neq('id', p.id)
    .order('published_at', { ascending: false, nullsFirst: false }).limit(3)
  return (data ?? []) as unknown as CardProperty[]
}

/** Convierte un enlace de YouTube o Vimeo en la URL para incrustar (o null si no es válido). */
export function videoEmbedUrl(raw: string | null): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')
    let id: string | null = null
    if (host === 'youtu.be') id = u.pathname.slice(1)
    else if (host === 'youtube.com' || host === 'm.youtube.com') id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1] ?? null
    if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
    if (host === 'vimeo.com') {
      const v = u.pathname.match(/^\/(\d+)/)?.[1]
      if (v) return `https://player.vimeo.com/video/${v}`
    }
  } catch { /* enlace inválido */ }
  return null
}
