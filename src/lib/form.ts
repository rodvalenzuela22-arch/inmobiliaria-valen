/** Devuelve lo que la persona escribió, para no perderlo si el formulario tiene errores. */
export function valuesFrom(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  for (const key of new Set(fd.keys())) {
    if (key.startsWith('$')) continue // campos internos de Next
    const all = fd.getAll(key).filter((v): v is string => typeof v === 'string')
    out[key] = all.length > 1 ? all : (all[0] ?? '')
  }
  return out
}

/** Acepta solo rutas internas que empiecen con `base` (evita redirecciones a otros sitios). */
export function safeReturn(path: unknown, base: string): string {
  return typeof path === 'string' && path.startsWith(base) && !path.startsWith('//') ? path : base
}

/** Agrega ?ok=... o ?error=... a una ruta interna. */
export function withMessage(path: string, kind: 'ok' | 'error', msg: string): string {
  const u = new URL(path, 'http://local')
  u.searchParams.delete('ok')
  u.searchParams.delete('error')
  u.searchParams.set(kind, msg)
  return u.pathname + u.search
}
