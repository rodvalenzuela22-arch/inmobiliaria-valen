import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Pantallas del panel que se pueden ver sin sesión
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/olvide-contrasena', '/admin/nueva-contrasena']

/** Renueva la sesión y bloquea /admin/* a quien no inició sesión. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // getUser() valida el token contra Supabase (no confiar solo en la cookie)
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname.replace(/\/$/, '') || '/'

  if (!user && path.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.includes(path)) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return response
}
