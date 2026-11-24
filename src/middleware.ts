import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

// Solo corre en el panel; el sitio público no necesita sesión.
export const config = { matcher: ['/admin/:path*'] }
