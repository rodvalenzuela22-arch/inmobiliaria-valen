import type { Metadata } from 'next'
import { AuthShell } from '../auth-shell'
import { ForgotForm } from '../forms'

export const metadata: Metadata = { title: 'Recuperar contraseña', robots: { index: false } }

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <AuthShell title="Recuperá tu contraseña" intro="Te enviaremos un enlace por email para crear una nueva.">
      {error === 'enlace' && (
        <p role="alert" className="alert-error mb-5">El enlace venció o ya se usó. Pedí uno nuevo.</p>
      )}
      <ForgotForm />
    </AuthShell>
  )
}
