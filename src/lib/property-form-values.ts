export type FormValues = Record<string, string | string[]>

const s = (x: unknown) => (x === null || x === undefined ? '' : String(x))

/** Valores iniciales para un formulario de propiedad nueva. */
export function emptyProperty(currency: string): FormValues {
  return {
    title: '', operation: 'venta', type: 'casa', status: 'borrador', price: '', currency,
    bedrooms: '', bathrooms: '', garage_spaces: '0', area_total: '', area_covered: '',
    province: 'Tucumán', city: '', neighborhood: '', address: '', latitude: '', longitude: '',
    description: '', video_url: '', featured: '', show_when_closed: 'on', features: [],
  }
}

/** Convierte una fila de la base en valores de formulario (todo texto). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function propertyToFormValues(p: Record<string, any>): FormValues {
  return {
    title: s(p.title), operation: s(p.operation), type: s(p.type), status: s(p.status),
    price: s(p.price), currency: s(p.currency), bedrooms: s(p.bedrooms), bathrooms: s(p.bathrooms),
    garage_spaces: s(p.garage_spaces), area_total: s(p.area_total), area_covered: s(p.area_covered),
    province: s(p.province), city: s(p.city), neighborhood: s(p.neighborhood), address: s(p.address),
    latitude: s(p.latitude), longitude: s(p.longitude), description: s(p.description), video_url: s(p.video_url),
    featured: p.featured ? 'on' : '', show_when_closed: p.show_when_closed ? 'on' : '', features: p.features ?? [],
  }
}
