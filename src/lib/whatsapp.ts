import { getSiteUrl } from './site'

/** Enlace wa.me con mensaje prellenado. `number` va en formato internacional, solo dígitos. */
export function whatsappUrl(number: string | null | undefined, message: string): string | null {
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/** Mensaje de consulta por una propiedad: título, código y link directo. */
export function propertyMessage(p: { title: string; code: string; slug: string }): string {
  return `Hola, quiero consultar por la propiedad "${p.title}" (código ${p.code}). ${getSiteUrl()}/propiedades/${p.slug}`
}

export const GENERIC_MESSAGE = 'Hola, quisiera hacer una consulta.'
