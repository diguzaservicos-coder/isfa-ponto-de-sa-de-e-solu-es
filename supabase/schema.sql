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
-- ============================================================
-- Encomendas, dashboard e financeiro (só a gestão acede)
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_address text not null default '',
  status text not null default 'pendente' check (status in ('pendente','entregue','cancelado')),
  items jsonb not null default '[]'::jsonb,
  discount numeric not null default 0 check (discount >= 0),
  delivery_fee numeric not null default 0 check (delivery_fee >= 0),
  total numeric not null default 0 check (total >= 0),
  notes text not null default '',
  stock_applied boolean not null default false,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.orders add column if not exists customer_address text not null default '';
create index if not exists orders_created_idx on public.orders (created_at desc);
alter table public.orders enable row level security;

drop policy if exists "encomendas: admin le" on public.orders;
create policy "encomendas: admin le" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "encomendas: admin insere" on public.orders;
create policy "encomendas: admin insere" on public.orders for insert to authenticated with check (public.is_admin());
drop policy if exists "encomendas: admin altera" on public.orders;
create policy "encomendas: admin altera" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "encomendas: admin elimina" on public.orders;
create policy "encomendas: admin elimina" on public.orders for delete to authenticated using (public.is_admin());

-- Calcula o total no servidor e acerta o stock quando a encomenda passa a "entregue" (ou deixa de estar)
create or replace function public.orders_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare it jsonb; sub numeric := 0; v_before integer; v_after integer; v_qty integer; v_pid text; v_name text;
begin
  if tg_op = 'DELETE' then
    if old.stock_applied and coalesce(current_setting('isfa.skip_restore', true), '') <> 'on' then
      for it in select * from jsonb_array_elements(old.items) loop
        v_pid := it->>'productId'; v_qty := coalesce((it->>'qty')::integer, 0);
        select stock, name into v_before, v_name from public.products where id = v_pid for update;
        if found and v_before is not null and v_qty > 0 then
          v_after := v_before + v_qty;
          update public.products set stock = v_after, updated_at = now() where id = v_pid;
          insert into public.stock_movements (product_id, product_name, before_qty, after_qty, reason, by_user, kind, delta)
          values (v_pid, v_name, v_before, v_after, 'Encomenda #' || old.number || ' eliminada', auth.jwt() ->> 'email', 'entrada', v_qty);
        end if;
      end loop;
    end if;
    return old;
  end if;

  if not public.is_admin() and coalesce(current_setting('isfa.system', true), '') <> 'on' then raise exception 'Sem permissão' using errcode = '42501'; end if;
  for it in select * from jsonb_array_elements(new.items) loop
    if coalesce((it->>'qty')::numeric, 0) <= 0 or coalesce((it->>'unitPrice')::numeric, 0) < 0 then
      raise exception 'Linha de encomenda inválida' using errcode = 'P0001';
    end if;
    sub := sub + (it->>'qty')::numeric * (it->>'unitPrice')::numeric;
  end loop;
  new.total := greatest(sub - new.discount + new.delivery_fee, 0);
  new.updated_at := now();
  if new.status = 'entregue' and new.delivered_at is null then new.delivered_at := now(); end if;
  if new.status <> 'entregue' then new.delivered_at := null; end if;

  if new.status = 'entregue' and not new.stock_applied then
    for it in select * from jsonb_array_elements(new.items) loop
      v_pid := it->>'productId'; v_qty := (it->>'qty')::integer;
      select stock, name into v_before, v_name from public.products where id = v_pid for update;
      if found and v_before is not null then
        v_after := greatest(v_before - v_qty, 0);
        update public.products set stock = v_after, updated_at = now() where id = v_pid;
        insert into public.stock_movements (product_id, product_name, before_qty, after_qty, reason, by_user, kind, delta)
        values (v_pid, v_name, v_before, v_after, 'Encomenda #' || coalesce(new.number::text, '') || ' entregue', auth.jwt() ->> 'email', 'saida', v_after - v_before);
      end if;
    end loop;
    new.stock_applied := true;
  elsif new.status <> 'entregue' and new.stock_applied and tg_op = 'UPDATE' then
    for it in select * from jsonb_array_elements(old.items) loop
      v_pid := it->>'productId'; v_qty := (it->>'qty')::integer;
      select stock, name into v_before, v_name from public.products where id = v_pid for update;
      if found and v_before is not null then
        v_after := v_before + v_qty;
        update public.products set stock = v_after, updated_at = now() where id = v_pid;
        insert into public.stock_movements (product_id, product_name, before_qty, after_qty, reason, by_user, kind, delta)
        values (v_pid, v_name, v_before, v_after, 'Encomenda #' || new.number || ' deixou de estar entregue', auth.jwt() ->> 'email', 'entrada', v_qty);
      end if;
    end loop;
    new.stock_applied := false;
  end if;
  return new;
end; $$;

drop trigger if exists orders_before_write on public.orders;
create trigger orders_before_write before insert or update or delete on public.orders
  for each row execute function public.orders_before_write();

-- "Zerar operações": apaga todas as encomendas sem mexer no stock, produtos ou configurações
create or replace function public.reset_orders() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.is_admin() then raise exception 'Sem permissão' using errcode = '42501'; end if;
  perform set_config('isfa.skip_restore', 'on', true);
  delete from public.orders where true;
  get diagnostics n = row_count;
  return n;
end; $$;
revoke all on function public.reset_orders() from public, anon;
grant execute on function public.reset_orders() to authenticated;

-- Encomenda feita por um cliente no site (sem login). O preço e o nome vêm sempre do catálogo, nunca do navegador.
create or replace function public.place_order(p_name text, p_phone text, p_address text, p_notes text, p_items jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare it jsonb; v_pid text; v_qty integer; v_name text; v_price numeric; v_items jsonb := '[]'::jsonb; v_number bigint; n integer := 0;
begin
  p_name := trim(coalesce(p_name, '')); p_phone := trim(coalesce(p_phone, ''));
  p_address := trim(coalesce(p_address, '')); p_notes := trim(coalesce(p_notes, ''));
  if char_length(p_name) < 2 or char_length(p_name) > 80 then raise exception 'Indique o seu nome' using errcode = 'P0001'; end if;
  if p_phone !~ '^[0-9+() -]{6,30}$' then raise exception 'Indique um número de telefone válido' using errcode = 'P0001'; end if;
  if char_length(p_address) > 200 or char_length(p_notes) > 500 then raise exception 'Texto demasiado longo' using errcode = 'P0001'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'A encomenda não tem produtos' using errcode = 'P0001';
  end if;
  if (select count(*) from public.orders where customer_phone = p_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Já enviou várias encomendas. Aguarde um pouco ou fale connosco pelo WhatsApp.' using errcode = 'P0001';
  end if;
  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := it->>'productId';
    begin v_qty := (it->>'qty')::integer; exception when others then v_qty := 0; end;
    if v_qty < 1 or v_qty > 999 then raise exception 'Quantidade inválida' using errcode = 'P0001'; end if;
    select name, price into v_name, v_price from public.products where id = v_pid and published = true;
    if not found then raise exception 'Um dos produtos já não está disponível' using errcode = 'P0001'; end if;
    v_items := v_items || jsonb_build_array(jsonb_build_object('productId', v_pid, 'name', v_name, 'qty', v_qty, 'unitPrice', coalesce(v_price, 0)));
    n := n + 1;
  end loop;
  perform set_config('isfa.system', 'on', true);
  insert into public.orders (customer_name, customer_phone, customer_address, notes, items, status)
  values (p_name, p_phone, p_address, p_notes, v_items, 'pendente') returning number into v_number;
  return v_number;
end; $$;
revoke all on function public.place_order(text,text,text,text,jsonb) from public;
grant execute on function public.place_order(text,text,text,text,jsonb) to anon, authenticated;
