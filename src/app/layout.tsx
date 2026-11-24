import type { Metadata } from 'next'
import { Bricolage_Grotesque, Public_Sans } from 'next/font/google'
import './globals.css'
import { preconnect } from 'react-dom'
import { getSiteUrl } from '@/lib/site'

// Dos familias claramente distintas: titulares con carácter + texto de lectura sobrio
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' })
const body = Public_Sans({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'Inmobiliaria', template: '%s · Inmobiliaria' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) preconnect(process.env.NEXT_PUBLIC_SUPABASE_URL)
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
