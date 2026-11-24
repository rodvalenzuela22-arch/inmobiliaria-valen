'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const back = (kind: 'ok' | 'error', msg: string) =>
  redirect(`/admin/usuarios?${kind}=${encodeURIComponent(msg)}`)

const roleSchema = z.enum(['admin', 'editor'])

/** Alta de usuario con contraseña provisoria (no depende del envío de emails). */
export async function createUser(formData: FormData) {
  await requireAdmin() // verificación en servidor: nunca confiar en que el botón estaba oculto

  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email('Ingresá un email válido.'),
      fullName: z.string().trim().min(2, 'Ingresá el nombre.').max(120),
      role: roleSchema,
      password: z.string().min(10, 'La contraseña provisoria debe tener al menos 10 caracteres.').max(72),
    })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return back('error', parsed.error.issues[0].message)

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  })
  if (error || !data.user) {
    const exists = error?.message.toLowerCase().includes('already')
    return back('error', exists ? 'Ya existe un usuario con ese email.' : 'No pudimos crear el usuario. Revisá los datos e intentá de nuevo.')
  }

  // El perfil nace como "editor" (trigger de la base); se ajusta si corresponde
  if (parsed.data.role === 'admin') {
    await admin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id)
  }
  revalidatePath('/admin/usuarios')
  return back('ok', 'Usuario creado. Pasale la contraseña provisoria; puede cambiarla con "Olvidé mi contraseña".')
}

/** Cambia rol o estado (activo/inactivo) de otro usuario. */
export async function updateUser(formData: FormData) {
  const me = await requireAdmin()

  const parsed = z
    .object({ id: z.string().uuid(), role: roleSchema })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return back('error', 'Datos inválidos.')
  // Evita que el admin se quite el acceso a sí mismo (siempre queda al menos un admin activo)
  if (parsed.data.id === me.id) return back('error', 'No podés modificar tu propia cuenta.')

  const active = formData.get('active') === 'on'
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role: parsed.data.role, active }).eq('id', parsed.data.id)
  if (error) return back('error', 'No pudimos guardar los cambios.')

  revalidatePath('/admin/usuarios')
  return back('ok', 'Cambios guardados.')
}
