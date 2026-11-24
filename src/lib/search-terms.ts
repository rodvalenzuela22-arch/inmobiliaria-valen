/**
 * Convierte lo escrito en el buscador en palabras seguras: sin tildes, en minúsculas y sin símbolos.
 * Coincide con la columna `search_text` de la base de datos (que también se guarda sin tildes).
 */
export function searchTerms(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^-+|-+$/g, ''))
    .filter((w) => w.length >= 2)
    .slice(0, 6)
}
