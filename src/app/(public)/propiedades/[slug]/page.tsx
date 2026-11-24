import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PropertyDetail, summary } from '@/components/public/property-detail'
import { createPublicClient, getPropertyBySlug, getPublicSettings, getRelated, imgUrl, orderedImages } from '@/lib/public-data'

export const revalidate = 60
// Las propiedades que se publiquen después del build se generan en la primera visita y quedan guardadas como estáticas
export const dynamicParams = true

/** En el build se genera el HTML de cada propiedad visible. */
export async function generateStaticParams() {
  const { data } = await createPublicClient().from('properties').select('slug').limit(5000)
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getPropertyBySlug(slug)
  if (!p) return { title: 'Propiedad no encontrada', robots: { index: false } }

  const first = orderedImages(p.property_images)[0]
  // Se prefiere el JPG liviano de 1200x630: WhatsApp y Facebook lo muestran de forma confiable
  const image = first
    ? first.path_og
      ? { url: imgUrl(first.path_og), width: 1200, height: 630, alt: p.title }
      : { url: imgUrl(first.path_large), width: first.width ?? undefined, height: first.height ?? undefined, alt: p.title }
    : undefined
  const description = summary(p)
  return {
    title: p.title,
    description,
    alternates: { canonical: `/propiedades/${p.slug}` },
    robots: p.status === 'vendida_alquilada' ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title: p.title, description, url: `/propiedades/${p.slug}`, type: 'website', ...(image ? { images: [image] } : {}) },
    twitter: { card: 'summary_large_image', title: p.title, description, ...(image ? { images: [image.url] } : {}) },
  }
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params
  const p = await getPropertyBySlug(slug)
  if (!p) notFound()
  const [s, related] = await Promise.all([getPublicSettings(), getRelated(p)])
  return <PropertyDetail p={p} s={s} related={related} />
}
