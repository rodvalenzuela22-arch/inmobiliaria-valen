-- =====================================================================
-- FASE 1 · Esquema de base de datos del portal inmobiliario
-- Ejecutar UNA sola vez en Supabase > SQL Editor (antes de crear usuarios).
-- =====================================================================

create extension if not exists unaccent with schema extensions;

-- ---------- Tipos enumerados ----------
create type public.user_role       as enum ('admin', 'editor');
create type public.operation_type  as enum ('venta', 'alquiler', 'alquiler_temporario');
create type public.property_type   as enum ('casa', 'departamento', 'terreno', 'local', 'oficina', 'cochera');
create type public.property_status as enum ('borrador', 'publicada', 'reservada', 'vendida_alquilada');
create type public.currency_code   as enum ('ARS', 'USD');

-- ---------- Utilidades ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Convierte "Casa con pileta, Nueva Córdoba" en "casa-con-pileta-nueva-cordoba"
create or replace function public.slugify(txt text) returns text
language sql stable as $$
  select left(trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(txt, ''))), '[^a-z0-9]+', '-', 'g')), 80)
$$;

-- ---------- Perfiles de usuario (extienden auth.users) ----------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '' check (char_length(full_name) <= 120),
  role       public.user_role not null default 'editor',
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Al crearse un usuario se crea su perfil. El PRIMER usuario del sistema es admin;
-- los siguientes son editores (el admin puede cambiarles el rol desde el panel).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    case when exists (select 1 from public.profiles) then 'editor'::public.user_role
         else 'admin'::public.user_role end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si ya existían usuarios antes de esta migración, les crea el perfil (el más antiguo es admin).
insert into public.profiles (id, full_name, role)
select u.id, left(coalesce(u.raw_user_meta_data ->> 'full_name', ''), 120),
       case when row_number() over (order by u.created_at) = 1
            then 'admin'::public.user_role else 'editor'::public.user_role end
from auth.users u
on conflict (id) do nothing;

-- Helpers de permisos (security definer para no entrar en bucle con RLS)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and active)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor') and active)
$$;

-- ---------- Propiedades ----------
create sequence public.property_code_seq start 1;

create table public.properties (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique
                   default ('PR-' || lpad(nextval('public.property_code_seq')::text, 5, '0')),
  slug           text not null unique,
  title          text not null check (char_length(title) between 5 and 140),
  description    text not null default '' check (char_length(description) <= 8000),

  operation      public.operation_type  not null,
  type           public.property_type   not null,
  status         public.property_status not null default 'borrador',
  featured       boolean not null default false,
  -- Si está vendida/alquilada: true = se muestra con etiqueta, false = se oculta
  show_when_closed boolean not null default true,

  -- Precio opcional: si es NULL el sitio muestra "Consultar precio" por WhatsApp
  price          numeric(14, 2) check (price is null or price > 0),
  currency       public.currency_code not null default 'USD',

  bedrooms       smallint check (bedrooms  is null or bedrooms  between 0 and 50),
  bathrooms      smallint check (bathrooms is null or bathrooms between 0 and 50),
  garage_spaces  smallint not null default 0 check (garage_spaces between 0 and 50),
  area_total     numeric(10, 2) check (area_total   is null or area_total   > 0),
  area_covered   numeric(10, 2) check (area_covered is null or area_covered > 0),
  features       text[] not null default '{}',   -- ej.: {pileta,patio,parrilla,amenities}

  province       text not null check (char_length(province) between 2 and 80),
  city           text not null check (char_length(city) between 2 and 80),
  neighborhood   text check (neighborhood is null or char_length(neighborhood) <= 80),
  address        text check (address is null or char_length(address) <= 160),
  latitude       double precision check (latitude  is null or latitude  between -90  and 90),
  longitude      double precision check (longitude is null or longitude between -180 and 180),

  video_url      text check (video_url is null or video_url ~* '^https://'),

  published_at   timestamptz,
  created_by     uuid references auth.users (id) on delete set null,
  updated_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Búsqueda de texto libre (español)
  search_vector  tsvector generated always as (
    to_tsvector('spanish',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' ||
      coalesce(neighborhood, '') || ' ' || coalesce(city, '') || ' ' || coalesce(code, ''))
  ) stored,

  check (area_covered is null or area_total is null or area_covered <= area_total),
  check ((latitude is null) = (longitude is null))
);

-- Completa el slug (URL amigable) al crear, y marca la primera fecha de publicación
create or replace function public.properties_before_write() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' and (new.slug is null or new.slug = '') then
    new.slug := public.slugify(new.title) || '-' || lower(new.code);
  end if;
  if new.status = 'publicada' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

-- (Los triggers BEFORE corren antes de validar NOT NULL, por eso el slug puede omitirse al insertar.)
create trigger properties_before_write before insert or update on public.properties
  for each row execute function public.properties_before_write();
create trigger properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

-- Índices pensados para los filtros del sitio público
create index properties_listing_idx  on public.properties (status, operation, type, published_at desc);
create index properties_location_idx on public.properties (province, city, neighborhood);
create index properties_price_idx    on public.properties (currency, price);
create index properties_featured_idx on public.properties (published_at desc) where featured and status = 'publicada';
create index properties_features_idx on public.properties using gin (features);
create index properties_search_idx   on public.properties using gin (search_vector);

-- ---------- Imágenes ----------
create table public.property_images (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  path_thumb  text not null,   -- ruta en el bucket property-images (≈400 px)
  path_medium text not null,   -- ≈1000 px (listados y ficha)
  path_large  text not null,   -- ≈1800 px (visor ampliado)
  width       integer,
  height      integer,
  alt_text    text check (alt_text is null or char_length(alt_text) <= 200),
  position    smallint not null default 0,
  is_cover    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index property_images_order_idx on public.property_images (property_id, position);
-- Una sola portada por propiedad
create unique index property_images_one_cover_idx on public.property_images (property_id) where is_cover;

-- ---------- Configuración (una sola fila) ----------
create table public.settings (
  id               smallint primary key default 1 check (id = 1),
  agency_name      text not null default 'Mi Inmobiliaria' check (char_length(agency_name) between 2 and 100),
  logo_path        text,
  -- Formato internacional, solo dígitos y sin "+" (ej.: 5493815551234)
  whatsapp_number  text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{8,15}$'),
  email            text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone            text check (phone is null or char_length(phone) <= 40),
  address          text check (address is null or char_length(address) <= 200),
  instagram_url    text check (instagram_url is null or instagram_url ~* '^https://'),
  facebook_url     text check (facebook_url  is null or facebook_url  ~* '^https://'),
  tiktok_url       text check (tiktok_url    is null or tiktok_url    ~* '^https://'),
  youtube_url      text check (youtube_url   is null or youtube_url   ~* '^https://'),
  color_primary    text not null default '#14505C' check (color_primary ~* '^#[0-9a-f]{6}$'),
  color_accent     text not null default '#D9A21B' check (color_accent  ~* '^#[0-9a-f]{6}$'),
  default_currency public.currency_code not null default 'USD',
  updated_at       timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------- Consultas del formulario de contacto ----------
create table public.inquiries (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid references public.properties (id) on delete set null,
  first_name     text not null check (char_length(first_name) between 1 and 80),
  last_name      text not null check (char_length(last_name)  between 1 and 80),
  phone          text not null check (char_length(phone) between 6 and 30),
  email          text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 160),
  offer_amount   numeric(14, 2) check (offer_amount is null or offer_amount > 0),  -- oferta opcional
  offer_currency public.currency_code,
  message        text check (message is null or char_length(message) <= 2000),
  handled        boolean not null default false,
  created_at     timestamptz not null default now(),
  check ((offer_amount is null) = (offer_currency is null))
);
create index inquiries_created_idx on public.inquiries (created_at desc);

-- =====================================================================
-- SEGURIDAD A NIVEL DE FILA (RLS)
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.properties      enable row level security;
alter table public.property_images enable row level security;
alter table public.settings        enable row level security;
alter table public.inquiries       enable row level security;

-- profiles: cada uno ve el suyo; el admin ve y modifica todos
create policy profiles_select_own   on public.profiles for select using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select using (public.is_admin());
create policy profiles_update_admin on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- properties: el público ve solo lo visible; el personal ve todo
create policy properties_select_public on public.properties for select using (
  status in ('publicada', 'reservada')
  or (status = 'vendida_alquilada' and show_when_closed)
);
create policy properties_select_staff on public.properties for select using (public.is_staff());
create policy properties_insert_staff on public.properties for insert with check (public.is_staff());
create policy properties_update_staff on public.properties for update using (public.is_staff()) with check (public.is_staff());
create policy properties_delete_admin on public.properties for delete using (public.is_admin());

-- property_images: visibles si la propiedad es visible (la subconsulta respeta RLS)
create policy images_select on public.property_images for select using (
  exists (select 1 from public.properties p where p.id = property_id)
);
create policy images_insert_staff on public.property_images for insert with check (public.is_staff());
create policy images_update_staff on public.property_images for update using (public.is_staff()) with check (public.is_staff());
create policy images_delete_staff on public.property_images for delete using (public.is_staff());

-- settings: lectura pública (datos de contacto), edición solo admin
create policy settings_select_all   on public.settings for select using (true);
create policy settings_update_admin on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- inquiries: solo el admin las lee/gestiona. Las altas las hace el servidor (Fase 3).
create policy inquiries_select_admin on public.inquiries for select using (public.is_admin());
create policy inquiries_update_admin on public.inquiries for update using (public.is_admin()) with check (public.is_admin());
create policy inquiries_delete_admin on public.inquiries for delete using (public.is_admin());

-- =====================================================================
-- ALMACENAMIENTO DE ARCHIVOS (fotos y logo)
-- Se restringe tipo y tamaño desde el propio bucket.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('property-images', 'property-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('branding',        'branding',        true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Los buckets son públicos para lectura por URL. Escritura solo con sesión y rol.
create policy storage_property_images_select on storage.objects for select to authenticated
  using (bucket_id = 'property-images' and public.is_staff());
create policy storage_property_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and public.is_staff());
create policy storage_property_images_update on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and public.is_staff());
create policy storage_property_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and public.is_staff());

create policy storage_branding_select on storage.objects for select to authenticated
  using (bucket_id = 'branding' and public.is_admin());
create policy storage_branding_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and public.is_admin());
create policy storage_branding_update on storage.objects for update to authenticated
  using (bucket_id = 'branding' and public.is_admin());
create policy storage_branding_delete on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and public.is_admin());

-- Fila única de configuración
insert into public.settings (id) values (1) on conflict do nothing;
