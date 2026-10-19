-- ISFA Equipamentos Hospitalares — base de dados (Supabase)
-- Execute este ficheiro uma vez no SQL Editor do Supabase (Project > SQL Editor > New query).
-- Depois execute supabase/seed.sql para carregar a lista inicial de produtos.

-- 1) Administradores -----------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

drop policy if exists "admin lê o próprio registo" on public.admin_users;
create policy "admin lê o próprio registo" on public.admin_users
  for select to authenticated using (user_id = auth.uid());
-- Não há políticas de escrita: novos administradores só se criam no SQL Editor (ver README).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2) Produtos ------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null check (length(trim(name)) > 0),
  reference text not null default '',
  category text not null default '',
  brand text not null default '',
  model text not null default '',
  short_description text not null default '',
  description text not null default '',
  specs jsonb not null default '[]'::jsonb,
  price numeric check (price is null or price >= 0),
  show_price boolean not null default false,
  stock integer check (stock is null or stock >= 0),
  show_stock boolean not null default false,
  main_image text not null default '',
  images text[] not null default '{}',
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "público lê produtos publicados" on public.products;
create policy "público lê produtos publicados" on public.products
  for select to anon, authenticated using (published or public.is_admin());

drop policy if exists "admin cria produtos" on public.products;
create policy "admin cria produtos" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin altera produtos" on public.products;
create policy "admin altera produtos" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin elimina produtos" on public.products;
create policy "admin elimina produtos" on public.products
  for delete to authenticated using (public.is_admin());

-- 3) Histórico de stock ---------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  product_name text not null default '',
  before_qty integer,
  after_qty integer,
  reason text not null default '',
  by_user text,
  created_at timestamptz not null default now()
);
alter table public.stock_movements enable row level security;

drop policy if exists "admin gere histórico de stock" on public.stock_movements;
create policy "admin gere histórico de stock" on public.stock_movements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

-- 4) Fotografias (Storage) --------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos: leitura pública" on storage.objects;
create policy "fotos: leitura pública" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-photos');

drop policy if exists "fotos: admin envia" on storage.objects;
create policy "fotos: admin envia" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-photos' and public.is_admin());

drop policy if exists "fotos: admin altera" on storage.objects;
create policy "fotos: admin altera" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-photos' and public.is_admin())
  with check (bucket_id = 'product-photos' and public.is_admin());

drop policy if exists "fotos: admin elimina" on storage.objects;
create policy "fotos: admin elimina" on storage.objects
  for delete to authenticated using (bucket_id = 'product-photos' and public.is_admin());


-- ============================================================
-- Controlo de stock automático (entrada / saída / definir / importar)
-- ============================================================
alter table public.stock_movements add column if not exists kind text not null default 'ajuste';
alter table public.stock_movements add column if not exists delta integer;

create or replace function public.apply_stock_movement(p_product_id text, p_kind text, p_qty integer, p_reason text default '')
returns integer language plpgsql security definer set search_path = public as $$
declare v_before integer; v_name text; v_after integer;
begin
  if not public.is_admin() then raise exception 'Sem permissão' using errcode = '42501'; end if;
  if p_qty is null or p_qty < 0 then raise exception 'Quantidade inválida' using errcode = '23514'; end if;
  if p_kind not in ('entrada','saida','ajuste','importacao') then raise exception 'Tipo de movimento inválido' using errcode = '22023'; end if;
  select stock, name into v_before, v_name from public.products where id = p_product_id for update;
  if not found then raise exception 'Produto não encontrado' using errcode = 'P0002'; end if;
  if p_kind = 'entrada' then v_after := coalesce(v_before,0) + p_qty;
  elsif p_kind = 'saida' then
    if v_before is null then raise exception 'Sem quantidade registada: use "Definir quantidade" primeiro' using errcode = 'P0001'; end if;
    if v_before < p_qty then raise exception 'Stock insuficiente: existem % unidades', v_before using errcode = 'P0001'; end if;
    v_after := v_before - p_qty;
  else v_after := p_qty; end if;
  update public.products set stock = v_after, updated_at = now() where id = p_product_id;
  insert into public.stock_movements (product_id, product_name, before_qty, after_qty, reason, by_user, kind, delta)
  values (p_product_id, v_name, v_before, v_after,
    coalesce(nullif(trim(p_reason),''), case p_kind when 'entrada' then 'Entrada de mercadoria' when 'saida' then 'Saída de mercadoria' when 'importacao' then 'Importação de quantidades' else 'Contagem de stock' end),
    auth.jwt() ->> 'email', p_kind, v_after - coalesce(v_before,0));
  return v_after;
end; $$;

create or replace function public.apply_stock_import(p_rows jsonb, p_reason text default 'Importação de quantidades')
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0;
begin
  if not public.is_admin() then raise exception 'Sem permissão' using errcode = '42501'; end if;
  for r in select * from jsonb_to_recordset(p_rows) as x(id text, qty integer) loop
    perform public.apply_stock_movement(r.id, 'importacao', r.qty, p_reason); n := n + 1;
  end loop;
  return n;
end; $$;

revoke all on function public.apply_stock_movement(text,text,integer,text) from public, anon;
revoke all on function public.apply_stock_import(jsonb,text) from public, anon;
grant execute on function public.apply_stock_movement(text,text,integer,text) to authenticated;
grant execute on function public.apply_stock_import(jsonb,text) to authenticated;
