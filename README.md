# Portal inmobiliario · Versión completa (Fases 1 a 4)

## Probar en tu computadora
1. Crear un proyecto en https://supabase.com (gratis).
2. Supabase > SQL Editor: ejecutar, en este orden y **una sola vez cada uno**:
   1. `supabase/migrations/001_schema.sql`
   2. `supabase/migrations/002_og_image.sql`  (imagen para compartir por WhatsApp)
   3. `supabase/migrations/003_search.sql`  ← **nuevo en la Fase 4, obligatorio** (búsqueda por palabra)
   4. `supabase/migrations/004_reels.sql`  ← **nuevo:** carrusel de reels del inicio
   5. `supabase/seed.sql` (opcional: propiedades de ejemplo sin fotos)
3. Supabase > Authentication > Providers > Email: activo, y **desactivar "Allow new users to sign up"**.
4. Supabase > Authentication > URL Configuration: agregar `http://localhost:3000/**` a "Redirect URLs".
5. Supabase > Authentication > Users > Add user: tu usuario (con "Auto Confirm User"). **El primer usuario es administrador.**
6. Copiar `.env.example` a `.env.local` y completar las claves.
7. `npm install` y `npm run dev`.
   - Sitio público: http://localhost:3000
   - Panel: http://localhost:3000/admin

## Estructura
- `supabase/` esquema SQL (tablas, índices, RLS, buckets), migración de la Fase 3 y datos de ejemplo.
- `src/lib/` clientes de Supabase, roles, validaciones, datos públicos, filtros, WhatsApp, SEO, email.
- `src/components/public/` piezas del sitio público (tarjeta, galería, mapa, formulario de consulta...).
- `src/app/(public)/` sitio público: inicio, `propiedades`, `propiedades/[slug]`, `contacto`.
- `src/app/admin/` panel de administración (Fases 1 y 2).
- `src/app/sitemap.ts` y `robots.ts` para buscadores.

## Novedades de esta versión
- Navegación fluida en el sitio público (sin recargar la página) y filtros que se aplican al instante.
- Vista previa de borradores: en la edición de una propiedad, botón "Vista previa".
- En la carga de propiedades, la ciudad es un menú desplegable según la provincia (Tucumán y el norte primero), con opción "Otra ciudad…".
- Los filtros del sitio muestran siempre las provincias del norte. Los datos de ejemplo (`seed.sql`) ahora son del norte; ver las instrucciones en el archivo.

## Fase 4
- Búsqueda por palabra (barrio, ciudad, código, "pileta"…) en el inicio y en el listado; ignora tildes y mayúsculas.
- Eliminar propiedades es más rápido (las fotos se borran en segundo plano) y el botón muestra "Eliminando…".
- "← Ver sitio" en el panel y "← Volver al sitio" en el login.
- Cabeceras de seguridad (HSTS, permisos) y política de contenido en modo "solo informar".
- Pantallas de error y de carga en el panel y en las fichas.
- **Publicación:** seguí la *Guía de instalación, configuración y publicación* (documento aparte).

## Reels y páginas estáticas
- **Reels:** en Configuración > "Reels del inicio" se suben videos verticales (MP4, hasta 50 MB) o se pegan enlaces de reels de Instagram / Shorts de YouTube. Si no hay ninguno, el carrusel no aparece. Requiere `004_reels.sql`.
- **Estático:** inicio, listado, contacto y cada ficha se generan como HTML en `npm run build` y se regeneran solos al editar desde el panel (o como máximo cada minuto). Los filtros del listado consultan Supabase desde el navegador. El panel `/admin` sigue siendo dinámico (necesita sesión).
