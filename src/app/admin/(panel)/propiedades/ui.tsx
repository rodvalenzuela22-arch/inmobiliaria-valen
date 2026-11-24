'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { STATUSES } from '@/lib/constants'

/** Selector de estado que guarda apenas se elige una opción. */
export function QuickStatus({ id, status, returnTo, action }: {
  id: string; status: string; returnTo: string; action: (fd: FormData) => void | Promise<void>
}) {
  const ref = useRef<HTMLFormElement>(null)
  return (
    <form ref={ref} action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label htmlFor={`st-${id}`} className="sr-only">Estado</label>
      <select
        id={`st-${id}`}
        name="status"
        defaultValue={status}
        onChange={() => ref.current?.requestSubmit()}
        className="input !w-auto !py-1.5 text-sm"
      >
        {Object.entries(STATUSES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
    </form>
  )
}

/** Botones de la ventana de confirmación: muestran "Eliminando…" mientras se procesa. */
function DeleteDialogButtons({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus()
  return (
    <>
      <button type="button" onClick={onCancel} disabled={pending} className="btn-secondary">Cancelar</button>
      <button type="submit" disabled={pending} className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2.5 font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? 'Eliminando…' : 'Sí, eliminar'}
      </button>
    </>
  )
}

/** Botón "Eliminar" con ventana de confirmación. */
export function DeleteButton({ id, title, returnTo, action, className = '' }: {
  id: string; title: string; returnTo: string; action: (fd: FormData) => void | Promise<void>; className?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={`btn-secondary !py-1.5 text-sm text-red-800 ${className}`}>
        Eliminar
      </button>
      <dialog ref={dialog} aria-labelledby={`del-${id}`} className="w-[min(92vw,28rem)] rounded-lg p-6 text-tinta backdrop:bg-tinta/50">
        <h2 id={`del-${id}`} className="text-lg font-semibold">¿Eliminar esta propiedad?</h2>
        <p className="mt-2 text-tinta/80">
          Vas a eliminar <strong>{title}</strong> junto con todas sus fotos. Esta acción no se puede deshacer.
        </p>
        <form action={action} className="mt-6 flex justify-end gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <DeleteDialogButtons onCancel={() => dialog.current?.close()} />
        </form>
      </dialog>
    </>
  )
}
