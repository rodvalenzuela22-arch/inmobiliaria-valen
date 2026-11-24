/** URL pública del sitio (sin barra final). Se configura en NEXT_PUBLIC_SITE_URL. */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}
