-- Reservations and the booking rules.
-- Visitors may only INSERT (never read) reservations. A trigger enforces the rules from
-- site_settings on every public insert, so they hold whichever client inserts the row.
-- All wall-clock times are Europe/Budapest.

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time time not null,
  party_size integer not null check (party_size between 1 and 100),
  -- Snapshot of booking_duration_minutes, so later setting changes don't move old bookings.
  duration_minutes integer not null check (duration_minutes > 0),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 6 and 30),
  email text not null check (char_length(email) between 3 and 254),
  note text check (char_length(note) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  -- When the guest accepted the privacy notice (GDPR).
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reservations_date_idx on public.reservations (date) where status <> 'cancelled';

create trigger reservations_updated_at before update on public.reservations
  for each row execute function private.set_updated_at();

-- Helpers ------------------------------------------------------------------------------------

create or replace function private.local_now()
returns timestamp
language sql
stable
set search_path = ''
as $$
  select now() at time zone 'Europe/Budapest'
$$;

-- Opening window of a date, or no row when closed. Closing at or before the opening time
-- means the venue closes after midnight.
create or replace function private.opening_window(
  p_date date,
  out opens_at timestamp,
  out closes_at timestamp
)
returns setof record
language sql
stable
set search_path = ''
as $$
  select p_date + h.opens,
         p_date + h.closes
           + case when h.closes <= h.opens then interval '1 day' else interval '0' end
  from public.opening_hours h
  where h.opens is not null
    and (array['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
               'Sunday'])[extract(isodow from p_date)::int] = any (h.days)
  order by h.sort_order
  limit 1
$$;

-- Bookable start times of a date: every slot from opening time such that the booking ends by
-- closing time. Starts stay on the date itself (no after-midnight starts).
create or replace function private.slot_starts(p_date date)
returns setof timestamp
language sql
stable
set search_path = ''
as $$
  select generate_series(
    w.opens_at,
    least(
      w.closes_at - make_interval(mins => s.booking_duration_minutes),
      (p_date + 1)::timestamp - interval '1 second'
    ),
    make_interval(mins => s.booking_slot_minutes)
  )
  from private.opening_window(p_date) w
  cross join public.site_settings s
$$;

-- Highest number of guests in any slot-length window that overlaps [p_start, p_end).
-- Counts pending and confirmed bookings.
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
      where r.status <> 'cancelled'
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

-- Public availability ------------------------------------------------------------------------

-- Slots of a date that are still in the future (respecting the minimum notice), each flagged
-- whether a party of this size still fits. No personal data leaves the function.
create or replace function public.available_slots(p_date date, p_party_size integer)
returns table (slot_time time, available boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.site_settings;
  now_local timestamp := private.local_now();
begin
  select * into s from public.site_settings where id;
  if not found or p_date is null or p_party_size is null or p_party_size < 1
     or p_date < now_local::date or p_date > now_local::date + s.booking_days_ahead then
    return;
  end if;

  return query
    select st::time,
           p_party_size <= s.booking_max_party_size
             and private.peak_guests(st, st + make_interval(mins => s.booking_duration_minutes))
                 + p_party_size <= s.booking_capacity
    from private.slot_starts(p_date) st
    where st >= now_local + make_interval(mins => s.booking_min_notice_minutes)
    order by st;
end
$$;

revoke all on function public.available_slots(date, integer) from public;
grant execute on function public.available_slots(date, integer) to anon, authenticated;

-- Insert rules -------------------------------------------------------------------------------

-- Errors use SQLSTATE P0001 with a stable code as the message; the app maps codes to Hungarian
-- text. Admins, the service role and direct database sessions (no JWT) skip the rules, so the
-- staff can enter phone bookings freely.
create or replace function private.check_reservation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.site_settings;
  starts_at timestamp := new.date + new.time;
  now_local timestamp := private.local_now();
begin
  select * into s from public.site_settings where id;

  if auth.role() is null or auth.role() = 'service_role' or public.is_admin() then
    new.duration_minutes := coalesce(new.duration_minutes, s.booking_duration_minutes, 90);
    return new;
  end if;

  if s.id is null then
    raise exception 'booking_unavailable';
  end if;

  new.status := 'pending';
  new.duration_minutes := s.booking_duration_minutes;
  new.created_at := now();
  -- The client asserts consent; the timestamp is always the server's.
  if new.consent_at is null then
    raise exception 'consent_required';
  end if;
  new.consent_at := now();

  -- Serialise public inserts so two concurrent bookings cannot both take the last seats.
  perform pg_advisory_xact_lock(hashtext('bajor.reservations'));

  if new.party_size > s.booking_max_party_size then
    raise exception 'party_too_large';
  end if;
  if new.date < now_local::date or new.date > now_local::date + s.booking_days_ahead then
    raise exception 'date_out_of_range';
  end if;
  if not exists (select 1 from private.slot_starts(new.date) st where st = starts_at) then
    raise exception 'invalid_slot';
  end if;
  if starts_at < now_local + make_interval(mins => s.booking_min_notice_minutes) then
    raise exception 'too_late';
  end if;
  if private.peak_guests(starts_at, starts_at + make_interval(mins => new.duration_minutes))
     + new.party_size > s.booking_capacity then
    raise exception 'slot_full';
  end if;

  return new;
end
$$;

create trigger reservations_check before insert on public.reservations
  for each row execute function private.check_reservation();

-- Privileges and Row Level Security ----------------------------------------------------------

revoke all on public.reservations from anon, authenticated;
-- Visitors can set only the guest-supplied columns; status, duration and timestamps come from
-- defaults and the trigger.
grant insert (date, time, party_size, name, phone, email, note, consent_at)
  on public.reservations to anon;
grant select, insert, update, delete on public.reservations to authenticated;

alter table public.reservations enable row level security;

create policy "Public creates pending reservations" on public.reservations
  for insert to anon, authenticated with check (status = 'pending');
create policy "Admins manage reservations" on public.reservations
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
