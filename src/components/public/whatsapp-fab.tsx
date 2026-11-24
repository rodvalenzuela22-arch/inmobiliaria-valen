import { WhatsAppIcon } from './icons'

/** Botón flotante de WhatsApp, visible en móvil y escritorio. */
export function WhatsAppFab({ href }: { href: string | null }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#0E7A4F] px-4 py-3 font-medium text-white shadow-lg transition-colors hover:bg-[#0B6340] sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden sm:inline">Consultar por WhatsApp</span>
      <span className="sr-only sm:hidden">Consultar por WhatsApp</span>
    </a>
  )
}
