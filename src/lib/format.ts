export function formatPrice(price: number | null, currency: string): string {
  if (price === null || price === undefined) return 'Consultar precio'
  return `${currency} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Number(price))}`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}
