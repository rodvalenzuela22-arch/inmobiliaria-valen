'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

/**
 * Formulario de búsqueda que arma la URL con los filtros y navega sin recargar la página
 * (más fluido). Ignora los campos vacíos para mantener los enlaces limpios y compartibles.
 */
export function GetForm({ action, className = '', children, ...props }: Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action' | 'method' | 'onSubmit'> & { action: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <form
      {...props}
      action={action}
      method="get"
      aria-busy={pending}
      className={`${className} ${pending ? 'opacity-70' : ''}`}
      onSubmit={(e) => {
        e.preventDefault()
        const qs = new URLSearchParams()
        for (const [k, v] of new FormData(e.currentTarget).entries()) {
          if (typeof v === 'string' && v.trim() !== '') qs.append(k, v)
        }
        const url = qs.toString() ? `${action}?${qs}` : action
        start(() => router.push(url))
      }}
    >
      {children}
    </form>
  )
}
