import { z } from 'zod'
import { CURRENCIES, FEATURE_KEYS, OPERATION_KEYS, PROVINCES, STATUS_KEYS, TYPE_KEYS } from './constants'

// Texto vacío => null (los campos opcionales llegan como "" desde el formulario)
export const blank = (v: unknown) => (v == null || (typeof v === 'string' && v.trim() === '') ? null : v)
export const optText = (max: number) => z.preprocess(blank, z.string().trim().max(max, `Máximo ${max} caracteres.`).nullable())
export const num = (label: string) => z.coerce.number({ invalid_type_error: `${label}: ingresá un número.` })
const optInt = (label: string, max: number) =>
  z.preprocess(blank, num(label).int(`${label}: debe ser un número entero.`).min(0, `${label}: no puede ser negativo.`).max(max, `${label}: valor demasiado alto.`).nullable())
export const optPositive = (label: string) =>
  z.preprocess(blank, num(label).positive(`${label}: debe ser mayor que cero.`).max(1e12, `${label}: valor demasiado alto.`).nullable())
export const choice = <T extends [string, ...string[]]>(values: T, msg: string) => z.enum(values, { errorMap: () => ({ message: msg }) })

const videoUrl = z.preprocess(
  blank,
  z.string().trim().max(300).url('El video debe ser un enlace válido.').refine((u) => {
    try {
      const url = new URL(u)
      const host = url.hostname.replace(/^www\./, '')
      return url.protocol === 'https:' && ['youtube.com', 'm.youtube.com', 'youtu.be', 'vimeo.com'].includes(host)
    } catch { return false }
  }, 'El video debe ser un enlace https de YouTube o Vimeo.').nullable(),
)

export const propertySchema = z
  .object({
    title: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres.').max(140, 'El título admite hasta 140 caracteres.'),
    operation: choice(OPERATION_KEYS as [string, ...string[]], 'Elegí la operación.'),
    type: choice(TYPE_KEYS as [string, ...string[]], 'Elegí el tipo de propiedad.'),
    status: choice(STATUS_KEYS as [string, ...string[]], 'Elegí el estado.'),
    featured: z.boolean(),
    show_when_closed: z.boolean(),
    price: optPositive('Precio'),
    currency: choice(CURRENCIES as unknown as [string, ...string[]], 'Elegí la moneda.'),
    bedrooms: optInt('Dormitorios', 50),
    bathrooms: optInt('Baños', 50),
    garage_spaces: z.preprocess((v) => blank(v) ?? 0, num('Cocheras').int('Cocheras: debe ser un número entero.').min(0).max(50)),
    area_total: optPositive('Superficie total'),
    area_covered: optPositive('Superficie cubierta'),
    features: z.array(choice(FEATURE_KEYS as [string, ...string[]], 'Característica inválida.')),
    province: choice(PROVINCES as unknown as [string, ...string[]], 'Elegí la provincia.'),
    city: z.string().trim().min(2, 'Ingresá la ciudad.').max(80, 'Máximo 80 caracteres.'),
    neighborhood: optText(80),
    address: optText(160),
    latitude: z.preprocess(blank, num('Latitud').min(-90, 'Latitud fuera de rango.').max(90, 'Latitud fuera de rango.').nullable()),
    longitude: z.preprocess(blank, num('Longitud').min(-180, 'Longitud fuera de rango.').max(180, 'Longitud fuera de rango.').nullable()),
    description: z.string().trim().max(8000, 'La descripción admite hasta 8000 caracteres.'),
    video_url: videoUrl,
  })
  .superRefine((d, ctx) => {
    if ((d.latitude === null) !== (d.longitude === null)) {
      ctx.addIssue({ code: 'custom', path: [d.latitude === null ? 'latitude' : 'longitude'], message: 'Completá latitud y longitud, o dejá ambas vacías.' })
    }
    if (d.area_covered !== null && d.area_total !== null && d.area_covered > d.area_total) {
      ctx.addIssue({ code: 'custom', path: ['area_covered'], message: 'La superficie cubierta no puede superar a la total.' })
    }
  })

/** Convierte el FormData en el objeto que espera propertySchema. */
export function propertyFromForm(fd: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = Object.fromEntries(fd)
  raw.features = fd.getAll('features')
  raw.featured = fd.get('featured') === 'on'
  raw.show_when_closed = fd.get('show_when_closed') === 'on'
  return raw
}

const optHttps = (label: string) =>
  z.preprocess(blank, z.string().trim().max(200).url(`${label}: ingresá un enlace válido.`).startsWith('https://', `${label}: debe empezar con https://`).nullable())

export const settingsSchema = z.object({
  agency_name: z.string().trim().min(2, 'Ingresá el nombre de la inmobiliaria.').max(100, 'Máximo 100 caracteres.'),
  logo_path: z.preprocess(blank, z.string().regex(/^[A-Za-z0-9._-]{1,120}$/, 'Logo inválido.').nullable()),
  whatsapp_number: z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(/[\s+()-]/g, '') : v),
    z.string().regex(/^[0-9]{8,15}$/, 'WhatsApp: usá formato internacional, solo números (ej.: 5491155551234).'),
  ),
  email: z.preprocess(blank, z.string().trim().toLowerCase().email('Email inválido.').max(160).nullable()),
  phone: optText(40),
  address: optText(200),
  instagram_url: optHttps('Instagram'),
  facebook_url: optHttps('Facebook'),
  tiktok_url: optHttps('TikTok'),
  youtube_url: optHttps('YouTube'),
  color_primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color principal inválido.').transform((s) => s.toLowerCase()),
  color_accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color de acento inválido.').transform((s) => s.toLowerCase()),
  default_currency: choice(CURRENCIES as unknown as [string, ...string[]], 'Elegí la moneda.'),
})
