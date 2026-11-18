-- ============================================================
-- Banners da página principal (faixa no topo do site)
-- ============================================================
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  image text not null,
  title text not null default '' check (char_length(title) <= 120),
  link text not null default '' check (link = '' or link ~ '^(https://[^[:space:]]+|#[A-Za-z0-9_-]+)$'),
  enabled boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists banners_position_idx on public.banners (position, created_at);
alter table public.banners enable row level security;

drop policy if exists "banners: leitura publica" on public.banners;
create policy "banners: leitura publica" on public.banners for select to anon, authenticated using (true);
drop policy if exists "banners: admin insere" on public.banners;
create policy "banners: admin insere" on public.banners for insert to authenticated with check (public.is_admin());
drop policy if exists "banners: admin altera" on public.banners;
create policy "banners: admin altera" on public.banners for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "banners: admin elimina" on public.banners;
create policy "banners: admin elimina" on public.banners for delete to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-banners', 'site-banners', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "banners-img: leitura publica" on storage.objects;
create policy "banners-img: leitura publica" on storage.objects for select to anon, authenticated using (bucket_id = 'site-banners');
drop policy if exists "banners-img: admin envia" on storage.objects;
create policy "banners-img: admin envia" on storage.objects for insert to authenticated with check (bucket_id = 'site-banners' and public.is_admin());
drop policy if exists "banners-img: admin altera" on storage.objects;
create policy "banners-img: admin altera" on storage.objects for update to authenticated using (bucket_id = 'site-banners' and public.is_admin()) with check (bucket_id = 'site-banners' and public.is_admin());
drop policy if exists "banners-img: admin elimina" on storage.objects;
create policy "banners-img: admin elimina" on storage.objects for delete to authenticated using (bucket_id = 'site-banners' and public.is_admin());

-- Banners iniciais (só se ainda não existir nenhum)
insert into public.banners (image, position)
select v.image, v.position from (values ('builtin:banner-1', 1), ('builtin:banner-2', 2)) as v(image, position)
where not exists (select 1 from public.banners);
