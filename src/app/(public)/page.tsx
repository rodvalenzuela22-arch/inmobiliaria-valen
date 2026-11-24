import Link from 'next/link'
import { PropertyCard } from '@/components/public/property-card'
import { ReelsCarousel } from '@/components/public/reels-carousel'
import { SearchBox } from '@/components/public/search-box'
import { WhatsAppFab } from '@/components/public/whatsapp-fab'
import { getHomeProperties, getLocationOptions, getPublicSettings } from '@/lib/public-data'
import { jsonLd } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site'
import { GENERIC_MESSAGE, whatsappUrl } from '@/lib/whatsapp'

export const revalidate = 60 // el inicio se actualiza como máximo cada minuto (y al instante cuando se edita desde el panel)

export default async function HomePage() {
  const [s, { featured, latest }, loc] = await Promise.all([getPublicSettings(), getHomeProperties(), getLocationOptions()])
  const wa = whatsappUrl(s.whatsapp_number, GENERIC_MESSAGE)
  // Si hay pocas destacadas, se completa con las últimas publicadas
  const featuredIds = new Set(featured.map((p) => p.id))
  const recent = latest.filter((p) => !featuredIds.has(p.id)).slice(0, 6)

  const agencyLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: s.agency_name,
    url: getSiteUrl(),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
    ...(s.address ? { address: { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'AR' } } : {}),
    sameAs: [s.instagram_url, s.facebook_url, s.tiktok_url, s.youtube_url].filter(Boolean),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(agencyLd) }} />

      <section className="bg-petroleo text-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/75">{s.agency_name}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Encontrá el lugar donde querés estar
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">Casas, departamentos, terrenos y locales en venta y alquiler.</p>
          <div className="mt-10"><SearchBox cities={loc.citiesOf()} /></div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 pt-12 sm:px-6">
        {featured.length > 0 && (
          <section aria-labelledby="dest">
            <h2 id="dest" className="text-2xl font-semibold sm:text-3xl">Propiedades destacadas</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p, i) => <PropertyCard key={p.id} p={p} whatsappNumber={s.whatsapp_number} priority={i < 3} />)}
            </div>
          </section>
        )}

        {/* Solo aparece si hay reels cargados en Configuración */}
        {s.reels.length > 0 && <ReelsCarousel reels={s.reels} />}

        {recent.length > 0 && (
          <section aria-labelledby="rec">
            <div className="flex items-end justify-between gap-4">
              <h2 id="rec" className="text-2xl font-semibold sm:text-3xl">Últimas publicaciones</h2>
              <Link href="/propiedades" className="font-medium text-petroleo underline underline-offset-4">Ver todas</Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((p) => <PropertyCard key={p.id} p={p} whatsappNumber={s.whatsapp_number} />)}
            </div>
          </section>
        )}

        {featured.length === 0 && recent.length === 0 && (
          <p className="rounded-lg border border-arena bg-white p-8 text-center">Pronto vamos a publicar nuevas propiedades. Mientras tanto, escribinos y te asesoramos.</p>
        )}

        <section className="rounded-xl bg-petroleo-soft p-8 text-center sm:p-12" aria-labelledby="cta">
          <h2 id="cta" className="text-2xl font-semibold sm:text-3xl">¿No encontrás lo que buscás?</h2>
          <p className="mx-auto mt-3 max-w-xl text-tinta/80">Contanos qué necesitás y te ayudamos a encontrarlo.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contacto" className="btn-primary">Dejanos tu consulta</Link>
          </div>
        </section>
      </div>

      <WhatsAppFab href={wa} />
    </>
  )
}
