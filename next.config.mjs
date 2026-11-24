const isDev = process.env.NODE_ENV !== 'production'
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

// Política de contenido (CSP) en modo "solo informar": no bloquea nada, pero el navegador avisa en la consola
// si algo no cumple. Una vez publicado el sitio y sin avisos, se activa cambiando la clave por 'Content-Security-Policy'.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase} https://tile.openstreetmap.org https://i.ytimg.com`,
  `media-src 'self' blob: ${supabase}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} https://nominatim.openstreetmap.org`,
  'frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://www.instagram.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Cabeceras de seguridad para todo el sitio
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ]
  },
}
export default nextConfig
