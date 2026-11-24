import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold">No encontramos esa página</h1>
      <p className="mt-3 text-tinta/80">Puede que la propiedad ya no esté publicada o que el enlace sea incorrecto.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/propiedades" className="btn-primary">Ver propiedades</Link>
        <Link href="/" className="btn-secondary">Ir al inicio</Link>
      </div>
    </div>
  )
}
