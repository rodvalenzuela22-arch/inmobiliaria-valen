'use client'

import { useEffect, useRef } from 'react'

const DESKTOP = '(min-width: 1024px)'

/** Panel de filtros: plegable en el celular (se cierra al aplicar), siempre abierto en pantallas grandes. */
export function FiltersPanel({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const el = ref.current
    if (el && (mq.matches || activeCount > 0)) el.open = true // arranca abierto si ya hay filtros
    const sync = () => { if (ref.current && mq.matches) ref.current.open = true }
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <details
      ref={ref}
      className="rounded-lg border border-arena bg-white"
      // Al filtrar desde el celular se pliega el panel para ver los resultados
      onSubmit={() => { if (!window.matchMedia(DESKTOP).matches && ref.current) ref.current.open = false }}
    >
      <summary className="cursor-pointer list-none px-4 py-3 font-medium lg:hidden">
        Filtros{activeCount > 0 ? ` (${activeCount} activos)` : ''}
      </summary>
      <div className="p-4 lg:pt-4">{children}</div>
    </details>
  )
}
