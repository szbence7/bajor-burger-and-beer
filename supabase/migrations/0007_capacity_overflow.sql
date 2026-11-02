-- How many guests over capacity a booking would put its time window if it held seats now.
-- The admin panel asks before re-accepting a rejected or cancelled booking, whose seats may
-- have been taken since. 0 = it fits. Two-factor admins only.
create or replace function public.capacity_overflow(p_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.reservations;
  s public.site_settings;
  starts_at timestamp;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into r from public.reservations where id = p_id;
  if not found then
    return 0;
  end if;
  select * into s from public.site_settings where id;
  starts_at := r.date + r.time;
  return greatest(
    0,
    private.peak_guests(starts_at, starts_at + make_interval(mins => r.duration_minutes), r.id)
      + r.party_size - s.booking_capacity
  );
end
$$;

revoke all on function public.capacity_overflow(uuid) from public;
grant execute on function public.capacity_overflow(uuid) to authenticated;
