import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthShell } from '../auth-shell'
import { LoginForm } from '../forms'

export const metadata: Metadata = { title: 'Ingresar al panel', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // Si ya hay sesión válida, directo al panel
  if (await getCurrentUser()) redirect('/admin')
  const { error } = await searchParams

  return (
    <AuthShell title="Ingresá al panel" intro="Usá el email y la contraseña de tu cuenta.">
      {error === 'acceso' && (
        <p role="alert" className="alert-error mb-5">Tu cuenta no tiene acceso al panel. Consultá con el administrador.</p>
      )}
      <LoginForm />
    </AuthShell>
  )
}
