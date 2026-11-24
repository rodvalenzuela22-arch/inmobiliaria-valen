// Íconos simples en SVG (sin dependencias). Son decorativos: el texto del botón ya dice qué hace.
export function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  // Globo de chat con tres puntos (sencillo y legible a cualquier tamaño)
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 2.5c-5.2 0-9.5 3.9-9.5 8.8 0 2 .7 3.8 2 5.3L3.4 21.5l4.6-1.4c1.2.5 2.6.8 4 .8 5.2 0 9.5-3.9 9.5-8.8S17.2 2.5 12 2.5Z" />
      <circle cx="8" cy="11.5" r="1.3" fill="#fff" />
      <circle cx="12" cy="11.5" r="1.3" fill="#fff" />
      <circle cx="16" cy="11.5" r="1.3" fill="#fff" />
    </svg>
  )
}

export function ShareIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="m8.600 13.500 6.800 4M15.400 6.500l-6.800 4" />
    </svg>
  )
}
