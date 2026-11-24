-- =====================================================================
-- FASE 4 · Búsqueda por texto libre (sin importar tildes ni mayúsculas)
-- Ejecutar UNA vez en Supabase > SQL Editor (después de 001 y 002).
-- =====================================================================
create extension if not exists pg_trgm with schema extensions;

alter table public.properties add column if not exists search_text text not null default '';

-- Texto de búsqueda: título, descripción, lugar, código, tipo, operación y comodidades, todo sin tildes
create or replace function public.properties_set_search_text() returns trigger
language plpgsql as $$
begin
  new.search_text := lower(extensions.unaccent(
    coalesce(new.title, '') || ' ' || coalesce(new.description, '') || ' ' ||
    coalesce(new.province, '') || ' ' || coalesce(new.city, '') || ' ' ||
    coalesce(new.neighborhood, '') || ' ' || coalesce(new.address, '') || ' ' ||
    coalesce(new.code, '') || ' ' ||
    replace(new.type::text, '_', ' ') || ' ' || replace(new.operation::text, '_', ' ') || ' ' ||
    replace(array_to_string(new.features, ' '), '_', ' ')
  ));
  return new;
end $$;

drop trigger if exists properties_search_text on public.properties;
create trigger properties_search_text before insert or update on public.properties
  for each row execute function public.properties_set_search_text();

-- Completa el texto de búsqueda de las propiedades que ya existen
update public.properties set search_text = '';

-- Índice para que la búsqueda siga siendo rápida con muchas propiedades
create index if not exists properties_search_text_idx on public.properties using gin (search_text extensions.gin_trgm_ops);
