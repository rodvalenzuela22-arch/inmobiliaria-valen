import { getAgencyName } from '@/lib/settings'

/** Marco común de las pantallas de acceso: marca a la izquierda, formulario a la derecha. */
export async function AuthShell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  const agency = await getAgencyName()
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="flex flex-col justify-between bg-petroleo px-6 py-8 text-white sm:px-10 lg:py-12">
        <p className="font-display text-xl font-semibold">{agency}</p>
        <div className="my-10 max-w-md lg:my-0">
          <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Cada propiedad, con su ficha al día.
          </h2>
          <p className="mt-4 text-white/80">Panel de gestión del catálogo: cargá, publicá y ordená tus propiedades.</p>
        </div>
        <p className="hidden text-sm text-white/70 lg:block">Acceso exclusivo para el equipo.</p>
      </aside>
      <section className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {intro && <p className="mt-2 text-tinta/75">{intro}</p>}
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm"><a href="/" className="text-petroleo underline underline-offset-2">← Volver al sitio</a></p>
        </div>
      </section>
    </main>
  )
}
