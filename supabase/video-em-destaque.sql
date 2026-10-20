-- ============================================================
-- Vídeo em destaque da página principal (definicoes do site)
-- ============================================================
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

drop policy if exists "definicoes: leitura publica" on public.site_settings;
create policy "definicoes: leitura publica" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "definicoes: admin insere" on public.site_settings;
create policy "definicoes: admin insere" on public.site_settings for insert to authenticated with check (public.is_admin());
drop policy if exists "definicoes: admin altera" on public.site_settings;
create policy "definicoes: admin altera" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "definicoes: admin elimina" on public.site_settings;
create policy "definicoes: admin elimina" on public.site_settings for delete to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-videos', 'site-videos', true, 52428800, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "videos: leitura publica" on storage.objects;
create policy "videos: leitura publica" on storage.objects for select to anon, authenticated using (bucket_id = 'site-videos');
drop policy if exists "videos: admin envia" on storage.objects;
create policy "videos: admin envia" on storage.objects for insert to authenticated with check (bucket_id = 'site-videos' and public.is_admin());
drop policy if exists "videos: admin altera" on storage.objects;
create policy "videos: admin altera" on storage.objects for update to authenticated using (bucket_id = 'site-videos' and public.is_admin()) with check (bucket_id = 'site-videos' and public.is_admin());
drop policy if exists "videos: admin elimina" on storage.objects;
create policy "videos: admin elimina" on storage.objects for delete to authenticated using (bucket_id = 'site-videos' and public.is_admin());
