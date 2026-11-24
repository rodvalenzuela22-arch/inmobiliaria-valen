import Link from 'next/link'
import { Gallery, type GalleryImage } from '@/components/public/gallery'
import { WhatsAppIcon } from '@/components/public/icons'
import { InquiryForm } from '@/components/public/inquiry-form'
import { PropertyCard } from '@/components/public/property-card'
import { PropertyMapLoader } from '@/components/public/property-map-loader'
import { ShareButton } from '@/components/public/share-button'
import { WhatsAppFab } from '@/components/public/whatsapp-fab'
import { FEATURES, OPERATIONS, STATUSES, TYPES } from '@/lib/constants'
import { imgUrl, orderedImages, priceText, statusBadge, variantWidths, videoEmbedUrl, type CardProperty, type FullProperty, type PublicSettings } from '@/lib/public-data'
import { jsonLd } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site'
import { propertyMessage, whatsappUrl } from '@/lib/whatsapp'

/** Texto corto para la vista previa al compartir: precio, tipo, lugar y datos clave. */
export function summary(p: FullProperty): string {
  const parts = [
    priceText(p.price, p.currency, p.operation),
    `${TYPES[p.type as keyof typeof TYPES]} en ${OPERATIONS[p.operation as keyof typeof OPERATIONS].toLowerCase()}`,
    [p.neighborhood, p.city].filter(Boolean).join(', '),
    p.bedrooms ? `${p.bedrooms} dorm.` : null,
    p.area_total ? `${Number(p.area_total)} m²` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

export function PropertyDetail({ p, s, related, preview = false }: { p: FullProperty; s: PublicSettings; related: CardProperty[]; preview?: boolean }) {
  const images = orderedImages(p.property_images)
  const badge = statusBadge(p.status, p.operation)
  const closed = p.status === 'vendida_alquilada'
  const wa = whatsappUrl(s.whatsapp_number, propertyMessage(p))
  const url = `${getSiteUrl()}/propiedades/${p.slug}`
  const video = videoEmbedUrl(p.video_url)
  const place = [p.address, p.neighborhood, p.city, p.province].filter(Boolean).join(', ')

  const galleryImages: GalleryImage[] = images.map((img) => {
    const w = variantWidths(img)
    return { thumb: imgUrl(img.path_thumb), medium: imgUrl(img.path_medium), large: imgUrl(img.path_large), w: w.medium, h: Math.round(w.medium * ((img.height ?? 3) / (img.width ?? 4))) }
  })

  const facts: [string, string][] = [
    ['Tipo', TYPES[p.type as keyof typeof TYPES]],
    ['Operación', OPERATIONS[p.operation as keyof typeof OPERATIONS]],
    ...(p.bedrooms !== null ? [['Dormitorios', String(p.bedrooms)] as [string, string]] : []),
    ...(p.bathrooms !== null ? [['Baños', String(p.bathrooms)] as [string, string]] : []),
    ...(p.garage_spaces > 0 ? [['Cocheras', String(p.garage_spaces)] as [string, string]] : []),
    ...(p.area_total ? [['Superficie total', `${Number(p.area_total)} m²`] as [string, string]] : []),
    ...(p.area_covered ? [['Superficie cubierta', `${Number(p.area_covered)} m²`] as [string, string]] : []),
  ]

  const listingLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title,
    url,
    description: summary(p),
    ...(p.published_at ? { datePosted: p.published_at } : {}),
    ...(images.length ? { image: images.slice(0, 5).map((i) => imgUrl(i.path_large)) } : {}),
    ...(p.price !== null && !closed
      ? { offers: { '@type': 'Offer', price: Number(p.price), priceCurrency: p.currency, availability: p.status === 'reservada' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock' } }
      : {}),
    contentLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', ...(p.address ? { streetAddress: p.address } : {}), addressLocality: p.city, addressRegion: p.province, addressCountry: 'AR' },
      ...(p.latitude !== null && p.longitude !== null ? { geo: { '@type': 'GeoCoordinates', latitude: p.latitude, longitude: p.longitude } } : {}),
    },
  }

  const waButton = wa && (
    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full">
      <WhatsAppIcon /> {p.price === null ? 'Consultar precio por WhatsApp' : 'Consultar por WhatsApp'}
    </a>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listingLd) }} />}

      {preview && (
        <p role="status" className="mb-4 rounded-md border border-mostaza bg-mostaza/15 px-4 py-3 text-sm font-medium">
          Vista previa del equipo · Estado actual: {STATUSES[p.status as keyof typeof STATUSES]}.{' '}
          {p.status === 'borrador' ? 'Todavía no es visible para el público.' : 'Así se ve en el sitio.'}
        </p>
      )}
      <nav aria-label="Ruta de navegación" className="text-sm text-tinta/75">
        <Link href="/" className="underline">Inicio</Link> / <Link href="/propiedades" className="underline">Propiedades</Link> / <span aria-current="page">{p.code}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-8">
          <Gallery images={galleryImages} title={p.title} />

          <header>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded bg-petroleo-soft px-2 py-1 text-petroleo">{OPERATIONS[p.operation as keyof typeof OPERATIONS]}</span>
              <span className="rounded bg-arena/60 px-2 py-1">{TYPES[p.type as keyof typeof TYPES]}</span>
              {badge && <span className="rounded bg-mostaza px-2 py-1 text-tinta">{badge}</span>}
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{p.title}</h1>
            <p className="mt-2 text-tinta/80">{place}</p>
            <p className="mt-1 text-sm text-tinta/70">Código de referencia: {p.code}</p>
            <p className="mt-4 font-display text-3xl font-semibold text-petroleo lg:hidden">{priceText(p.price, p.currency, p.operation)}</p>
            {waButton && <div className="mt-4 lg:hidden">{waButton}</div>}
          </header>

          <section aria-labelledby="datos">
            <h2 id="datos" className="text-xl font-semibold">Características</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k}><dt className="text-sm text-tinta/70">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            {p.features.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Comodidades">
                {p.features.map((f) => (
                  <li key={f} className="rounded-full border border-arena bg-white px-3 py-1 text-sm">{FEATURES[f as keyof typeof FEATURES] ?? f}</li>
                ))}
              </ul>
            )}
          </section>

          {p.description && (
            <section aria-labelledby="desc">
              <h2 id="desc" className="text-xl font-semibold">Descripción</h2>
              {/* React escapa el texto: no hay riesgo de inyección. whitespace-pre-line respeta los saltos de línea */}
              <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed">{p.description}</p>
            </section>
          )}

          {video && (
            <section aria-labelledby="vid">
              <h2 id="vid" className="text-xl font-semibold">Video</h2>
              <div className="mt-4 aspect-video overflow-hidden rounded-lg bg-tinta">
                <iframe src={video} title={`Video de ${p.title}`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" className="h-full w-full" />
              </div>
            </section>
          )}

          {p.latitude !== null && p.longitude !== null && (
            <section aria-labelledby="mapa">
              <h2 id="mapa" className="text-xl font-semibold">Ubicación</h2>
              <p className="mt-2 text-tinta/80">{place}</p>
              <div className="mt-4"><PropertyMapLoader lat={p.latitude} lng={p.longitude} label={p.title} /></div>
              <a className="mt-2 inline-block text-sm text-petroleo underline" target="_blank" rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`}>Abrir en Google Maps</a>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start" aria-label="Contacto">
          <div className="rounded-lg border border-arena bg-white p-5">
            <p className="hidden font-display text-3xl font-semibold text-petroleo lg:block">{priceText(p.price, p.currency, p.operation)}</p>
            {badge && <p className="mt-2 rounded bg-mostaza/25 px-3 py-2 text-sm font-medium">Esta propiedad figura como: {badge}</p>}
            <div className="mt-4 hidden lg:block">{waButton}</div>
            {!preview && <div className="mt-4"><ShareButton url={url} title={p.title} /></div>}
          </div>

          {preview ? (
            <p className="rounded-lg border border-arena bg-white p-5 text-sm">Vista previa del equipo: acá aparece el formulario de consulta cuando la propiedad está publicada.</p>
          ) : closed ? (
            <p className="rounded-lg border border-arena bg-white p-5 text-sm">
              Esta propiedad ya no está disponible. <Link href="/propiedades" className="text-petroleo underline">Mirá propiedades similares</Link>.
            </p>
          ) : (
            <div className="rounded-lg border border-arena bg-white p-5">
              <h2 className="text-lg font-semibold">Enviar una consulta</h2>
              <div className="mt-4"><InquiryForm property={{ id: p.id, currency: p.currency as 'ARS' | 'USD' }} /></div>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="rel">
          <h2 id="rel" className="text-2xl font-semibold">Propiedades similares</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <PropertyCard key={r.id} p={r} whatsappNumber={s.whatsapp_number} />)}
          </div>
        </section>
      )}

      <WhatsAppFab href={wa} />
    </div>
  )
}
