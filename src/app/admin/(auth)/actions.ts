'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type FormState = { error?: string; ok?: string } | undefined

const emailSchema = z.string().trim().toLowerCase().email('Ingresá un email válido.')

/** Inicio de sesión con email y contraseña. */
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, 'Ingresá tu contraseña.') })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  // Mensaje único: no revela si el email existe
  if (error) return { error: 'El email o la contraseña no son correctos.' }
  redirect('/admin')
}

/** Pide el email de recuperación. Responde igual exista o no la cuenta. */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: emailSchema }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/admin/nueva-contrasena`,
  })
  return { ok: 'Si el email está registrado, te enviamos un enlace para crear una contraseña nueva. Revisá también la carpeta de spam.' }
}

/** Guarda la contraseña nueva (requiere haber entrado por el enlace del email o tener sesión). */
export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      password: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres.').max(72, 'La contraseña es demasiado larga.'),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: 'Las contraseñas no coinciden.', path: ['confirm'] })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'El enlace venció. Pedí uno nuevo desde "Olvidé mi contraseña".' }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: 'No pudimos guardar la contraseña. Probá con una distinta o pedí un enlace nuevo.' }
  redirect('/admin')
}
