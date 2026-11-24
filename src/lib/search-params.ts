import { FEATURE_KEYS, OPERATION_KEYS, TYPE_KEYS } from './constants'
import type { Filters } from './public-data'

type SP = Record<string, string | string[] | undefined>
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const num = (v: string | string[] | undefined) => {
  const s = first(v)
  if (s === undefined || s.trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 && n < 1e12 ? n : undefined
}
const text = (v: string | string[] | undefined) => first(v)?.trim().slice(0, 80) || undefined

/** Lee y sanea los filtros de la URL. Todo valor inválido se ignora. */
export function parseFilters(sp: SP): Filters {
  const operacion = first(sp.operacion)
  const tipo = first(sp.tipo)
  const moneda = first(sp.moneda)
  const orden = first(sp.orden)
  const feats = ([] as string[]).concat(sp.caracteristicas ?? []).filter((k) => (FEATURE_KEYS as string[]).includes(k))
  return {
    operacion: (OPERATION_KEYS as string[]).includes(operacion ?? '') ? operacion : undefined,
    tipo: (TYPE_KEYS as string[]).includes(tipo ?? '') ? tipo : undefined,
    q: text(sp.q), provincia: text(sp.provincia), ciudad: text(sp.ciudad), barrio: text(sp.barrio),
    moneda: moneda === 'ARS' || moneda === 'USD' ? moneda : undefined,
    precioMin: num(sp.precio_min), precioMax: num(sp.precio_max),
    dormitorios: num(sp.dormitorios), banos: num(sp.banos),
    supMin: num(sp.sup_min), supMax: num(sp.sup_max),
    cochera: first(sp.cochera) === '1',
    caracteristicas: [...new Set(feats)],
    orden: orden === 'precio_asc' || orden === 'precio_desc' ? orden : 'recientes',
    pagina: Math.max(1, Math.min(500, Math.floor(num(sp.pagina) ?? 1))),
  }
}

/** Cantidad de filtros activos (sin contar orden ni página). */
export function activeFilterCount(f: Filters): number {
  return [f.q, f.operacion, f.tipo, f.provincia, f.ciudad, f.barrio, f.moneda, f.precioMin, f.precioMax, f.dormitorios, f.banos, f.supMin, f.supMax]
    .filter((x) => x !== undefined).length + (f.cochera ? 1 : 0) + f.caracteristicas.length
}
