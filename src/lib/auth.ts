import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Role = 'admin' | 'editor'
export type CurrentUser = { id: string; email: string; fullName: string; role: Role }

/** Devuelve la persona con sesión válida y perfil activo, o null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, active')
    .eq('id', user.id)
    .single()
  if (!profile || !profile.active) return null

  return { id: user.id, email: user.email ?? '', fullName: profile.full_name, role: profile.role as Role }
}

/** Para páginas y acciones del panel: exige sesión (admin o editor). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login?error=acceso')
  return user
}

/** Para páginas y acciones solo de administrador. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/admin?error=permiso')
  return user
}
