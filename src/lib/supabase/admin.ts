import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Cliente con la clave de servicio: SALTEA las reglas de seguridad (RLS).
 * Usar únicamente en el servidor, después de verificar el rol (requireAdmin).
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
