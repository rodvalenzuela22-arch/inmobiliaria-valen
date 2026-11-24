import type { Metadata } from 'next'
import { AuthShell } from '../auth-shell'
import { NewPasswordForm } from '../forms'

export const metadata: Metadata = { title: 'Nueva contraseña', robots: { index: false } }

export default function NewPasswordPage() {
  return (
    <AuthShell title="Elegí tu contraseña nueva">
      <NewPasswordForm />
    </AuthShell>
  )
}
