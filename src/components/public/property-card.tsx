import Link from 'next/link'
import { OPERATIONS, TYPES } from '@/lib/constants'
import { imgUrl, orderedImages, priceText, statusBadge, variantWidths, type CardProperty } from '@/lib/public-data'
import { propertyMessage, whatsappUrl } from '@/lib/whatsapp'
import { WhatsAppIcon } from './icons'

/** Tarjeta de propiedad para listados y home. */
export function PropertyCard({ p, whatsappNumber, priority = false }: { p: CardProperty; whatsappNumber: string | null; priority?: boolean }) {
  const cover = orderedImages(p.property_images)[0]
  const badge = statusBadge(p.status, p.operation)
  const closed = p.status === 'vendida_alquilada'
  const wa = whatsappUrl(whatsappNumber, propertyMessage(p))
  const w = cover ? variantWidths(cover) : null
  const href = `/propiedades/${p.slug}`
  const place = [p.neighborhood, p.city].filter(Boolean).join(', ')

  const specs = [
    p.bedrooms !== null && p.bedrooms > 0 ? `${p.bedrooms} dorm.` : null,
    p.bathrooms !== null && p.bathrooms > 0 ? `${p.bathrooms} ${p.bathrooms === 1 ? 'baño' : 'baños'}` : null,
    p.garage_spaces > 0 ? `${p.garage_spaces} coch.` : null,
    p.area_total ? `${Number(p.area_total)} m²` : null,
  ].filter(Boolean)

  return (
    <article className={`flex flex-col overflow-hidden rounded-lg border border-arena bg-white ${closed ? 'opacity-90' : ''}`}>
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-arena/40" tabIndex={-1} aria-hidden="true">
        {cover && w ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl(cover.path_medium)}
            srcSet={`${imgUrl(cover.path_thumb)} ${w.thumb}w, ${imgUrl(cover.path_medium)} ${w.medium}w`}
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
            alt=""
            width={w.medium}
            height={Math.round(w.medium * ((cover.height ?? 3) / (cover.width ?? 4)))}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-tinta/60">Sin fotos</span>
        )}
        <span className="absolute left-3 top-3 rounded bg-white/95 px-2 py-1 text-xs font-semibold text-tinta">{OPERATIONS[p.operation as keyof typeof OPERATIONS]}</span>
        {badge && <span className="absolute right-3 top-3 rounded bg-mostaza px-2 py-1 text-xs font-semibold text-tinta">{badge}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-display text-xl font-semibold text-petroleo">{priceText(p.price, p.currency, p.operation)}</p>
        <h3 className="mt-1 text-base font-semibold leading-snug">
          <Link href={href} className="hover:text-petroleo hover:underline">{p.title}</Link>
        </h3>
        <p className="mt-1 text-sm text-tinta/75">{TYPES[p.type as keyof typeof TYPES]} · {place}</p>
        {specs.length > 0 && <p className="mt-2 text-sm text-tinta/85">{specs.join(' · ')}</p>}
        <p className="mt-2 text-xs text-tinta/60">Cód. {p.code}</p>
        {wa && (
          <div className="mt-auto pt-4">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full !py-2 text-sm">
              <WhatsAppIcon className="h-4 w-4" />
              {p.price === null ? 'Consultar precio' : 'Consultar por WhatsApp'}
              <span className="sr-only"> sobre {p.title}</span>
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
