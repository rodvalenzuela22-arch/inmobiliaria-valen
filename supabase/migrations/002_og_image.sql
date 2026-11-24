-- =====================================================================
-- FASE 3 · Imagen liviana para compartir (WhatsApp, Facebook, etc.)
-- Ejecutar UNA vez en Supabase > SQL Editor. Las fotos ya cargadas siguen funcionando
-- (usan la versión grande hasta que se vuelvan a subir).
-- =====================================================================
alter table public.property_images add column if not exists path_og text;
