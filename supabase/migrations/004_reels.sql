-- =====================================================================
-- Fase 5: carrusel de reels (videos verticales) en el inicio.
-- Ejecutar UNA sola vez en Supabase > SQL Editor.
-- =====================================================================

-- Lista de reels que se editan desde Configuración. Cada elemento es:
--   { "id": "...", "kind": "video",     "path": "archivo.mp4", "title": "..." }   ← video subido
--   { "id": "...", "kind": "instagram", "code": "C1a2B3c4D5e", "title": "..." }   ← reel de Instagram
--   { "id": "...", "kind": "youtube",   "code": "dQw4w9WgXcQ", "title": "..." }   ← Short de YouTube
alter table public.settings
  add column if not exists reels jsonb not null default '[]'::jsonb;

alter table public.settings drop constraint if exists settings_reels_check;
alter table public.settings
  add constraint settings_reels_check check (jsonb_typeof(reels) = 'array' and jsonb_array_length(reels) <= 20);

-- Bucket para los videos subidos (lectura pública por URL; escritura solo administradores).
-- 50 MB por archivo: es el máximo del plan gratuito de Supabase.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('reels', 'reels', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_reels_select on storage.objects;
drop policy if exists storage_reels_insert on storage.objects;
drop policy if exists storage_reels_update on storage.objects;
drop policy if exists storage_reels_delete on storage.objects;

create policy storage_reels_select on storage.objects for select to authenticated
  using (bucket_id = 'reels' and public.is_admin());
create policy storage_reels_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'reels' and public.is_admin());
create policy storage_reels_update on storage.objects for update to authenticated
  using (bucket_id = 'reels' and public.is_admin());
create policy storage_reels_delete on storage.objects for delete to authenticated
  using (bucket_id = 'reels' and public.is_admin());
