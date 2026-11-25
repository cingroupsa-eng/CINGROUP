-- ════════════════════════════════════════════════════════════════════
--  EL BAZAR DE MALEJA — Esquema completo de base de datos (Supabase)
--  Tu estilo, tu esencia.
--
--  Cómo usar: Supabase → SQL Editor → New query → pegar TODO este
--  archivo → Run. Es idempotente: se puede ejecutar más de una vez.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────────
-- 0. Utilidades
-- ────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 1. PROFILES (usuarios del panel)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil automáticamente al registrar un usuario en Auth.
-- IMPORTANTE: nace con rol 'user'. Para convertirlo en admin ver README.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ¿El usuario actual es administrador?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ────────────────────────────────────────────────────────────────────
-- 2. STORE SETTINGS (fila única, id = 1)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.store_settings (
  id               smallint primary key default 1 check (id = 1),
  business_name    text not null default 'EL BAZAR DE MALEJA',
  slogan           text not null default 'Tu estilo, tu esencia.',
  logo_url         text,
  hero_image_url   text,
  hero_title       text,
  hero_subtitle    text,
  whatsapp_number  text check (whatsapp_number is null or whatsapp_number ~ '^595[0-9]{8,10}$'),
  instagram_url    text,
  facebook_url     text,
  tiktok_url       text,
  address          text,
  business_hours   text,
  payment_methods  jsonb not null default '[
    {"id": "transferencia", "label": "Transferencia bancaria", "enabled": true, "details": ""},
    {"id": "efectivo", "label": "Efectivo", "enabled": true, "details": ""}
  ]'::jsonb,
  delivery_info    text,
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────────────
-- 3. CATEGORIES
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  description    text,
  image_url      text,
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists idx_categories_order on public.categories (display_order, name);

insert into public.categories (name, slug, description, display_order) values
  ('Ropa',       'ropa',       'Prendas para cada momento de tu día.',            1),
  ('Vestidos',   'vestidos',   'Siluetas que celebran tu feminidad.',             2),
  ('Blusas',     'blusas',     'Básicos esenciales y piezas statement.',          3),
  ('Pantalones', 'pantalones', 'Cortes cómodos con actitud.',                     4),
  ('Conjuntos',  'conjuntos',  'Looks completos, listos para brillar.',           5),
  ('Calzados',   'calzados',   'El paso perfecto para cada ocasión.',             6),
  ('Carteras',   'carteras',   'El complemento que define tu estilo.',            7),
  ('Accesorios', 'accesorios', 'Detalles que hacen la diferencia.',               8),
  ('Ofertas',    'ofertas',    'Precios especiales por tiempo limitado.',         9)
on conflict (slug) do nothing;

-- ────────────────────────────────────────────────────────────────────
-- 4. BRANDS
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────
-- 5. PRODUCTS
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  description           text,
  price_pyg             integer not null check (price_pyg >= 0),
  compare_at_price_pyg  integer check (compare_at_price_pyg is null or compare_at_price_pyg >= 0),
  category_id           uuid references public.categories (id) on delete set null,
  brand_id              uuid references public.brands (id) on delete set null,
  is_published          boolean not null default false,
  is_featured           boolean not null default false,
  is_new                boolean not null default true,
  is_on_sale            boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_products_category  on public.products (category_id);
create index if not exists idx_products_brand     on public.products (brand_id);
create index if not exists idx_products_published on public.products (is_published, created_at desc);
create index if not exists idx_products_flags     on public.products (is_published, is_featured, is_new, is_on_sale);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 6. PRODUCT IMAGES
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.product_images (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  url            text not null,
  alt_text       text,
  display_order  integer not null default 0
);

create index if not exists idx_product_images_product on public.product_images (product_id, display_order);

-- ────────────────────────────────────────────────────────────────────
-- 7. PRODUCT VARIANTS (talla + color + stock)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  size        text not null,
  color_name  text not null,
  color_hex   text not null default '#211820' check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  stock       integer not null default 0 check (stock >= 0),
  sku         text
);

create index if not exists idx_variants_product on public.product_variants (product_id);
create unique index if not exists uq_variants_combo on public.product_variants (product_id, lower(size), lower(color_name));
create unique index if not exists uq_variants_sku on public.product_variants (sku) where sku is not null;

-- ────────────────────────────────────────────────────────────────────
-- 8. ORDERS
-- ────────────────────────────────────────────────────────────────────
create sequence if not exists public.order_number_seq start 1;

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique
                    default ('EBM-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  customer_name   text not null check (char_length(customer_name) between 2 and 120),
  customer_phone  text not null check (customer_phone ~ '^595[0-9]{8,10}$'),
  notes           text check (notes is null or char_length(notes) <= 600),
  payment_method  text not null check (payment_method in ('transferencia', 'efectivo')),
  total_pyg       integer not null default 0 check (total_pyg >= 0),
  status          text not null default 'pendiente'
                    check (status in ('pendiente', 'confirmado', 'preparando', 'listo_entrega', 'entregado', 'cancelado')),
  stock_applied   boolean not null default false, -- interno: ¿ya se descontó stock?
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter sequence public.order_number_seq owned by public.orders.order_number;

create index if not exists idx_orders_status  on public.orders (status, created_at desc);
create index if not exists idx_orders_created on public.orders (created_at desc);
create index if not exists idx_orders_phone   on public.orders (customer_phone, created_at desc);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 9. ORDER ITEMS (snapshot de lo pedido)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  variant_id      uuid references public.product_variants (id) on delete set null,
  product_name    text not null,
  size            text not null,
  color_name      text not null,
  quantity        integer not null check (quantity > 0),
  unit_price_pyg  integer not null check (unit_price_pyg >= 0),
  subtotal_pyg    integer not null check (subtotal_pyg >= 0)
);

create index if not exists idx_order_items_order   on public.order_items (order_id);
create index if not exists idx_order_items_variant on public.order_items (variant_id);

-- ────────────────────────────────────────────────────────────────────
-- 10. LÓGICA DE NEGOCIO
-- ────────────────────────────────────────────────────────────────────

-- 10.1 Crear pedido (llamado desde el Server Action con la anon key).
-- Valida en el servidor: catálogo publicado, precios reales, stock
-- disponible, método de pago activo y WhatsApp configurado.
-- NO descuenta stock (eso ocurre al pasar a 'confirmado').
create or replace function public.create_order(
  p_customer_name   text,
  p_customer_phone  text,
  p_payment_method  text,
  p_notes           text,
  p_items           jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings    public.store_settings%rowtype;
  v_order_id    uuid;
  v_number      text;
  v_total       bigint := 0;
  v_lines       jsonb := '[]'::jsonb;
  v_row         record;
  v_recent      integer;
begin
  select * into v_settings from public.store_settings where id = 1;
  if v_settings.whatsapp_number is null then
    raise exception 'WHATSAPP_NOT_CONFIGURED';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 40 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  if p_payment_method not in ('transferencia', 'efectivo') or not exists (
    select 1 from jsonb_array_elements(v_settings.payment_methods) pm
    where pm ->> 'id' = p_payment_method and coalesce((pm ->> 'enabled')::boolean, false)
  ) then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  -- Anti-spam básico: máx. 5 solicitudes pendientes por teléfono por hora.
  select count(*) into v_recent from public.orders
  where customer_phone = p_customer_phone
    and status = 'pendiente'
    and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  insert into public.orders (customer_name, customer_phone, payment_method, notes)
  values (trim(p_customer_name), p_customer_phone, p_payment_method, nullif(trim(coalesce(p_notes, '')), ''))
  returning id, order_number into v_order_id, v_number;

  for v_row in
    with req as (
      select (e ->> 'variant_id')::uuid as variant_id,
             sum((e ->> 'quantity')::integer) as qty
      from jsonb_array_elements(p_items) e
      group by 1
    )
    select req.variant_id, req.qty,
           v.id as v_id, v.size, v.color_name, v.stock,
           p.id as product_id, p.name as product_name, p.price_pyg, p.is_published
    from req
    left join public.product_variants v on v.id = req.variant_id
    left join public.products p on p.id = v.product_id
  loop
    if v_row.v_id is null or v_row.is_published is not true then
      raise exception 'ITEM_UNAVAILABLE';
    end if;
    if v_row.qty is null or v_row.qty < 1 or v_row.qty > 99 then
      raise exception 'INVALID_QUANTITY';
    end if;
    if v_row.stock < v_row.qty then
      raise exception 'INSUFFICIENT_STOCK:%', v_row.product_name || ' (' || v_row.size || ' / ' || v_row.color_name || ') — disponibles: ' || v_row.stock;
    end if;

    insert into public.order_items
      (order_id, product_id, variant_id, product_name, size, color_name, quantity, unit_price_pyg, subtotal_pyg)
    values
      (v_order_id, v_row.product_id, v_row.v_id, v_row.product_name, v_row.size, v_row.color_name,
       v_row.qty, v_row.price_pyg, v_row.price_pyg * v_row.qty);

    v_total := v_total + (v_row.price_pyg::bigint * v_row.qty);
    v_lines := v_lines || jsonb_build_object(
      'product_name', v_row.product_name,
      'size', v_row.size,
      'color_name', v_row.color_name,
      'quantity', v_row.qty,
      'unit_price_pyg', v_row.price_pyg,
      'subtotal_pyg', v_row.price_pyg * v_row.qty
    );
  end loop;

  update public.orders set total_pyg = v_total::integer where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_number,
    'total_pyg', v_total,
    'items', v_lines,
    'whatsapp_number', v_settings.whatsapp_number
  );
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, jsonb) to anon, authenticated;

-- 10.2 Gestión automática de stock según el estado del pedido.
--  • pendiente → confirmado/preparando/listo/entregado : descuenta stock.
--  • (cualquier estado con stock aplicado) → cancelado/pendiente : devuelve stock.
create or replace function public.handle_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status in ('confirmado', 'preparando', 'listo_entrega', 'entregado') and not old.stock_applied then
    for r in
      select variant_id, product_name, size, color_name, sum(quantity) as qty
      from public.order_items
      where order_id = new.id and variant_id is not null
      group by variant_id, product_name, size, color_name
    loop
      update public.product_variants
        set stock = stock - r.qty
        where id = r.variant_id and stock >= r.qty;
      if not found then
        raise exception 'Stock insuficiente para "%" (talla %, color %). Actualizá el inventario antes de confirmar.',
          r.product_name, r.size, r.color_name;
      end if;
    end loop;
    new.stock_applied := true;

  elsif new.status in ('pendiente', 'cancelado') and old.stock_applied then
    for r in
      select variant_id, sum(quantity) as qty
      from public.order_items
      where order_id = new.id and variant_id is not null
      group by variant_id
    loop
      update public.product_variants set stock = stock + r.qty where id = r.variant_id;
    end loop;
    new.stock_applied := false;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_stock on public.orders;
create trigger trg_orders_stock
  before update of status on public.orders
  for each row execute function public.handle_order_stock();

-- ────────────────────────────────────────────────────────────────────
-- 11. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.store_settings   enable row level security;
alter table public.categories       enable row level security;
alter table public.brands           enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- profiles
drop policy if exists "profiles: leer el propio o admin" on public.profiles;
create policy "profiles: leer el propio o admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: admin actualiza" on public.profiles;
create policy "profiles: admin actualiza" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- store_settings
drop policy if exists "settings: lectura pública" on public.store_settings;
create policy "settings: lectura pública" on public.store_settings
  for select using (true);
drop policy if exists "settings: admin actualiza" on public.store_settings;
create policy "settings: admin actualiza" on public.store_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- categories
drop policy if exists "categories: lectura pública activas" on public.categories;
create policy "categories: lectura pública activas" on public.categories
  for select using (is_active or public.is_admin());
drop policy if exists "categories: admin gestiona" on public.categories;
create policy "categories: admin gestiona" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- brands
drop policy if exists "brands: lectura pública" on public.brands;
create policy "brands: lectura pública" on public.brands
  for select using (true);
drop policy if exists "brands: admin gestiona" on public.brands;
create policy "brands: admin gestiona" on public.brands
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- products
drop policy if exists "products: lectura pública publicados" on public.products;
create policy "products: lectura pública publicados" on public.products
  for select using (is_published or public.is_admin());
drop policy if exists "products: admin gestiona" on public.products;
create policy "products: admin gestiona" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- product_images
drop policy if exists "images: lectura pública" on public.product_images;
create policy "images: lectura pública" on public.product_images
  for select using (
    exists (select 1 from public.products p where p.id = product_id and (p.is_published or public.is_admin()))
  );
drop policy if exists "images: admin gestiona" on public.product_images;
create policy "images: admin gestiona" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- product_variants
drop policy if exists "variants: lectura pública" on public.product_variants;
create policy "variants: lectura pública" on public.product_variants
  for select using (
    exists (select 1 from public.products p where p.id = product_id and (p.is_published or public.is_admin()))
  );
drop policy if exists "variants: admin gestiona" on public.product_variants;
create policy "variants: admin gestiona" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- orders / order_items: solo admin (las clientas crean pedidos vía create_order)
drop policy if exists "orders: admin gestiona" on public.orders;
create policy "orders: admin gestiona" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "order_items: admin gestiona" on public.order_items;
create policy "order_items: admin gestiona" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────
-- 12. STORAGE (imágenes públicas, escritura solo admin)
-- ────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('branding', 'branding', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage: admin lee" on storage.objects;
create policy "storage: admin lee" on storage.objects
  for select to authenticated
  using (bucket_id in ('products', 'branding') and public.is_admin());

drop policy if exists "storage: admin sube" on storage.objects;
create policy "storage: admin sube" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('products', 'branding') and public.is_admin());

drop policy if exists "storage: admin actualiza" on storage.objects;
create policy "storage: admin actualiza" on storage.objects
  for update to authenticated
  using (bucket_id in ('products', 'branding') and public.is_admin());

drop policy if exists "storage: admin elimina" on storage.objects;
create policy "storage: admin elimina" on storage.objects
  for delete to authenticated
  using (bucket_id in ('products', 'branding') and public.is_admin());

-- ════════════════════════════════════════════════════════════════════
-- FIN. Siguiente paso: crear tu usuario y darle rol admin (ver README).
-- ════════════════════════════════════════════════════════════════════
