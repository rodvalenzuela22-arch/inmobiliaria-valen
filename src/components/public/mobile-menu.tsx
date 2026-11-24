'use client'

import Link from 'next/link'
import { useRef } from 'react'

/** Menú del celular: <details> nativo que se cierra al tocar una opción (la página ya no se recarga). */
export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const ref = useRef<HTMLDetailsElement>(null)
  const close = () => ref.current?.removeAttribute('open')
  return (
    <details ref={ref} className="relative md:hidden">
      <summary className="btn-secondary cursor-pointer list-none !py-2 text-sm">Menú</summary>
      <nav aria-label="Principal (móvil)" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-arena bg-white p-2 shadow-lg">
        <Link href="/" onClick={close} className="block rounded px-3 py-2.5 hover:bg-niebla">Inicio</Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={close} className="block rounded px-3 py-2.5 hover:bg-niebla">{l.label}</Link>
        ))}
      </nav>
    </details>
  )
}
