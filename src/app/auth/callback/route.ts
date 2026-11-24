import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Recibe el enlace del email de recuperación, abre la sesión y lleva a la pantalla pedida. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'
  // Solo se permiten destinos dentro del panel (evita redirecciones a otros sitios)
  const safeNext = next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`)
  }
  return NextResponse.redirect(`${origin}/admin/olvide-contrasena?error=enlace`)
}
