'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { login, requestPasswordReset, updatePassword } from './actions'

function Feedback({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (state?.error) return <p role="alert" className="alert-error">{state.error}</p>
  if (state?.ok) return <p role="status" className="alert-ok">{state.ok}</p>
  return null
}

export function LoginForm() {
  const [state, action] = useActionState(login, undefined)
  return (
    <form action={action} className="space-y-5" noValidate>
      <Feedback state={state} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <SubmitButton pendingText="Ingresando…">Ingresar</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/admin/olvide-contrasena" className="text-petroleo underline underline-offset-2">Olvidé mi contraseña</Link>
      </p>
    </form>
  )
}

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined)
  return (
    <form action={action} className="space-y-5" noValidate>
      <Feedback state={state} />
      <div>
        <label htmlFor="email" className="label">Email de tu cuenta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <SubmitButton pendingText="Enviando…">Enviar enlace</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/admin/login" className="text-petroleo underline underline-offset-2">Volver a ingresar</Link>
      </p>
    </form>
  )
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined)
  return (
    <form action={action} className="space-y-5" noValidate>
      <Feedback state={state} />
      <div>
        <label htmlFor="password" className="label">Contraseña nueva</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} className="input" aria-describedby="pw-help" />
        <p id="pw-help" className="mt-1.5 text-sm text-tinta/70">Mínimo 10 caracteres.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Repetí la contraseña</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="input" />
      </div>
      <SubmitButton pendingText="Guardando…">Guardar contraseña</SubmitButton>
    </form>
  )
}
