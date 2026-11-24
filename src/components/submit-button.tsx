'use client'
import { useFormStatus } from 'react-dom'

/** Botón que se deshabilita y avisa mientras el formulario se está enviando. */
export function SubmitButton({
  children,
  pendingText = 'Procesando…',
  className = 'w-full',
}: {
  children: React.ReactNode
  pendingText?: string
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={`btn-primary ${className}`} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  )
}
