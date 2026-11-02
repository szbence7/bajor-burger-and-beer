-- Admin panel: two-factor admins, reservation decisions, Hónap ajánlata, the PDF menu,
-- the notification log, Storage buckets and Realtime.

-- Admins need two factors -------------------------------------------------------------------

-- An admin is an Auth user with app_metadata.role = 'admin' whose session passed the
-- authenticator-app (TOTP) check: aal2. A password-only session (aal1) of the same user gets
-- nothing, so every RLS policy below and in earlier migrations enforces 2FA.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' and (auth.jwt() ->> 'aal') = 'aal2',
    false
  )
$$;

-- Reservation decisions ----------------------------------------------------------------------

-- pending → confirmed (accepted) or rejected (declined by the staff);
-- confirmed → cancelled (called off later). Only pending and confirmed hold seats.
alter table public.reservations drop constraint reservations_status_check;
alter table public.reservations add constraint reservations_status_check
  check (status in ('pending', 'confirmed', 'rejected', 'cancelled'));
alter table public.reservations
  add column status_changed_at timestamptz,
  -- Optional message from the staff, sent to the guest with the decision.
  add column decision_note text check (char_length(decision_note) <= 500);

drop index public.reservations_date_idx;
create index reservations_date_idx on public.reservations (date)
  where status in ('pending', 'confirmed');

create or replace function private.stamp_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end
$$;

create trigger reservations_status_changed before update on public.reservations
  for each row execute function private.stamp_status_change();

create or replace function private.peak_guests(
  p_start timestamp,
  p_end timestamp,
  p_exclude uuid default null
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(max(load), 0)::int
  from (
    select (
      select coalesce(sum(r.party_size), 0)
      from public.reservations r
      where r.status in ('pending', 'confirmed')
        and r.id is distinct from p_exclude
        and r.date between p_start::date - 1 and p_end::date
        and r.date + r.time < w.start + make_interval(mins => s.booking_slot_minutes)
        and w.start < r.date + r.time + make_interval(mins => r.duration_minutes)
    ) as load
    from public.site_settings s
    cross join lateral generate_series(
      p_start,
      p_end - interval '1 second',
      make_interval(mins => s.booking_slot_minutes)
    ) as w (start)
  ) windows
$$;

-- The app server generates the id of a new booking, so it can log the notification emails
-- against it without being allowed to read reservations.
grant insert (id) on public.reservations to anon;

-- Hónap ajánlata (home page) -----------------------------------------------------------------

-- image: a bundled image key from src/data/images.ts, or an absolute URL (Storage upload).
create table public.monthly_specials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  description text not null default '' check (char_length(description) <= 300),
  price integer not null check (price between 0 and 1000000),
  image text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger monthly_specials_updated_at before update on public.monthly_specials
  for each row execute function private.set_updated_at();

revoke all on public.monthly_specials from anon, authenticated;
grant select on public.monthly_specials to anon;
grant select, insert, update, delete on public.monthly_specials to authenticated;
alter table public.monthly_specials enable row level security;

create policy "Public reads active monthly specials" on public.monthly_specials
  for select to anon, authenticated using (is_active);
create policy "Admins manage monthly specials" on public.monthly_specials
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- PDF menu -----------------------------------------------------------------------------------

-- Object path of the current menu in the "menu" bucket; the site serves it at /etlap.pdf.
alter table public.site_settings
  add column menu_pdf_path text check (menu_pdf_path ~ '^[A-Za-z0-9._-]+\.pdf$'),
  add column menu_pdf_updated_at timestamptz;

-- Notification log ---------------------------------------------------------------------------

-- One row per email the app tried to send, so the staff can see whether it went out.
-- Written by the app server with the service role; admins read it. Rows go with their
-- reservation (GDPR retention).
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations (id) on delete cascade,
  kind text not null check (kind in (
    'guest_received', 'staff_new', 'guest_confirmed', 'guest_rejected', 'guest_cancelled'
  )),
  recipient text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error text,
  created_at timestamptz not null default now()
);

create index notification_log_reservation_idx on public.notification_log (reservation_id);
create index notification_log_created_idx on public.notification_log (created_at desc);

revoke all on public.notification_log from anon, authenticated;
grant select on public.notification_log to authenticated;
alter table public.notification_log enable row level security;

create policy "Admins read the notification log" on public.notification_log
  for select to authenticated using ((select public.is_admin()));

-- Storage ------------------------------------------------------------------------------------

-- Public buckets: anyone can download by URL, only admins can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('menu', 'menu', true, 15 * 1024 * 1024, array['application/pdf']),
  ('media', 'media', true, 5 * 1024 * 1024,
   array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do nothing;

create policy "Admins read site files" on storage.objects
  for select to authenticated
  using (bucket_id in ('menu', 'media') and (select public.is_admin()));
create policy "Admins upload site files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('menu', 'media') and (select public.is_admin()));
create policy "Admins update site files" on storage.objects
  for update to authenticated
  using (bucket_id in ('menu', 'media') and (select public.is_admin()));
create policy "Admins delete site files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('menu', 'media') and (select public.is_admin()));

-- Realtime -----------------------------------------------------------------------------------

-- The admin panel subscribes to these; Realtime applies the RLS policies above, so only
-- two-factor admins receive the rows.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.reservations, public.notification_log;
  else
    raise notice 'Publication supabase_realtime not found: live updates in the admin panel are off';
  end if;
end
$$;
