-- Content: menu, beers, gallery, opening hours and site settings.
-- Visitors (anon) can read active rows; admins (app_metadata.role = 'admin') can do anything.

-- Internal helpers live in a schema PostgREST does not expose.
create schema if not exists private;
revoke all on schema private from public;

-- True when the request's JWT belongs to an admin. app_metadata can only be set with the
-- service role key, so users cannot grant themselves the role.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- Menu ---------------------------------------------------------------------------------------

-- kind decides how the site renders a category's items (burger card, side row, drink line).
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  kind text not null check (kind in ('burger', 'side', 'drink')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- For drinks, description holds the serving detail (e.g. "0,5 l").
-- image: a bundled image key from src/data/images.ts, or an absolute URL.
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  ingredients text[] not null default '{}',
  price integer not null check (price >= 0),
  image text,
  badges text[] not null default '{}'
    check (badges <@ array['Új', 'Csípős', 'Vega', 'A ház kedvence']::text[]),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_category_sort_idx on public.menu_items (category_id, sort_order);

-- Beers --------------------------------------------------------------------------------------

-- sizes: [{ "label": "0,5 l", "price": 1290 }, ...]
create table public.beers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 120),
  style text not null default '',
  brewery text not null default '',
  abv numeric(3, 1) not null check (abv >= 0 and abv < 100),
  serve text not null check (serve in ('csapolt', 'palackos')),
  sizes jsonb not null default '[]' check (jsonb_typeof(sizes) = 'array'),
  image text,
  is_house boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gallery ------------------------------------------------------------------------------------

-- url: a bundled image key from src/data/images.ts, or an absolute URL.
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text not null,
  category text not null check (category in ('Hely', 'Ételek', 'Sörök', 'Események')),
  is_tall boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gallery_images_sort_idx on public.gallery_images (sort_order);

-- Opening hours ------------------------------------------------------------------------------

-- Mirrors the OpeningHour type: opens/closes both null = closed; closes <= opens = the venue
-- closes after midnight.
create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  days text[] not null check (
    cardinality(days) > 0
    and days <@ array['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
                      'Sunday']::text[]
  ),
  opens time,
  closes time,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((opens is null) = (closes is null))
);

-- Site settings (single row) -----------------------------------------------------------------

-- socials: [{ "label": "Instagram", "href": "https://..." }, ...]
-- booking_*: the rules the reservation trigger and the availability function enforce.
create table public.site_settings (
  id boolean primary key default true check (id),
  street text not null,
  postal_code text not null,
  city text not null,
  country text not null default 'HU',
  phone text not null,
  email text not null,
  socials jsonb not null default '[]' check (jsonb_typeof(socials) = 'array'),
  booking_slot_minutes integer not null default 30
    check (booking_slot_minutes between 5 and 240),
  booking_duration_minutes integer not null default 90
    check (booking_duration_minutes between 15 and 720),
  booking_capacity integer not null default 40 check (booking_capacity > 0),
  booking_max_party_size integer not null default 8
    check (booking_max_party_size between 1 and 100),
  booking_days_ahead integer not null default 60 check (booking_days_ahead between 0 and 366),
  booking_min_notice_minutes integer not null default 120
    check (booking_min_notice_minutes between 0 and 10080),
  booking_hold_minutes integer not null default 15 check (booking_hold_minutes >= 0),
  updated_at timestamptz not null default now()
);

-- updated_at triggers ------------------------------------------------------------------------

create trigger menu_categories_updated_at before update on public.menu_categories
  for each row execute function private.set_updated_at();
create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function private.set_updated_at();
create trigger beers_updated_at before update on public.beers
  for each row execute function private.set_updated_at();
create trigger gallery_images_updated_at before update on public.gallery_images
  for each row execute function private.set_updated_at();
create trigger opening_hours_updated_at before update on public.opening_hours
  for each row execute function private.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function private.set_updated_at();

-- Privileges and Row Level Security ----------------------------------------------------------

-- Supabase's default privileges grant everything to anon/authenticated; be explicit instead.
revoke all on public.menu_categories, public.menu_items, public.beers, public.gallery_images,
  public.opening_hours, public.site_settings from anon, authenticated;
grant select on public.menu_categories, public.menu_items, public.beers, public.gallery_images,
  public.opening_hours, public.site_settings to anon;
grant select, insert, update, delete on public.menu_categories, public.menu_items,
  public.beers, public.gallery_images, public.opening_hours, public.site_settings
  to authenticated;

alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.beers enable row level security;
alter table public.gallery_images enable row level security;
alter table public.opening_hours enable row level security;
alter table public.site_settings enable row level security;

create policy "Public reads active menu categories" on public.menu_categories
  for select to anon, authenticated using (is_active);
create policy "Public reads active menu items" on public.menu_items
  for select to anon, authenticated using (
    is_active and exists (
      select 1 from public.menu_categories c where c.id = category_id and c.is_active
    )
  );
create policy "Public reads active beers" on public.beers
  for select to anon, authenticated using (is_active);
create policy "Public reads active gallery images" on public.gallery_images
  for select to anon, authenticated using (is_active);
create policy "Public reads opening hours" on public.opening_hours
  for select to anon, authenticated using (true);
create policy "Public reads site settings" on public.site_settings
  for select to anon, authenticated using (true);

create policy "Admins manage menu categories" on public.menu_categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage menu items" on public.menu_items
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage beers" on public.beers
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage gallery images" on public.gallery_images
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage opening hours" on public.opening_hours
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage site settings" on public.site_settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
