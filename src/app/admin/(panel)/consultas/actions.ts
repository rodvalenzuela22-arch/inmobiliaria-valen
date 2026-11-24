'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { safeReturn, withMessage } from '@/lib/form'
import { createClient } from '@/lib/supabase/server'

const LIST = '/admin/consultas'

/** Marca una consulta como atendida (o la vuelve a pendiente). */
export async function setHandled(formData: FormData) {
  await requireAdmin()
  const back = safeReturn(formData.get('returnTo'), LIST)
  const parsed = z.object({ id: z.string().uuid(), handled: z.enum(['true', 'false']) }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect(withMessage(back, 'error', 'Datos inválidos.'))

  const supabase = await createClient()
  const { error } = await supabase.from('inquiries').update({ handled: parsed.data.handled === 'true' }).eq('id', parsed.data.id)
  if (error) redirect(withMessage(back, 'error', 'No pudimos actualizar la consulta.'))
  revalidatePath('/admin', 'layout')
  redirect(back)
}
