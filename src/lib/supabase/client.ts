import { createBrowserClient } from '@supabase/ssr'

/** Cliente para el navegador (usa la sesión de quien está logueado). Se usa para subir fotos. */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
