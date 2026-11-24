import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/public-data'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 3600

/** Mapa del sitio para buscadores: páginas fijas + cada propiedad publicada o reservada. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const { data } = await createPublicClient()
    .from('properties')
    .select('slug, updated_at')
    .in('status', ['publicada', 'reservada'])
    .order('updated_at', { ascending: false })
    .limit(5000)

  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/propiedades`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/propiedades?operacion=venta`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/propiedades?operacion=alquiler`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/propiedades?operacion=alquiler_temporario`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/contacto`, changeFrequency: 'yearly', priority: 0.5 },
    ...(data ?? []).map((p: { slug: string; updated_at: string }) => ({
      url: `${base}/propiedades/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
