-- GDPR retention: reservations are deleted 12 months after the visit date.

create or replace function private.purge_old_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted integer;
begin
  delete from public.reservations
  where date < (private.local_now()::date - interval '12 months')::date;
  get diagnostics deleted = row_count;
  return deleted;
end
$$;

-- Run it daily with pg_cron (bundled with Supabase's Postgres image). Without pg_cron, schedule
-- `select private.purge_old_reservations();` some other way (see supabase/README.md).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    -- 03:30 UTC daily; scheduling under an existing name replaces that job.
    perform cron.schedule(
      'bajor-purge-old-reservations',
      '30 3 * * *',
      'select private.purge_old_reservations()'
    );
  else
    raise notice 'pg_cron is not available: schedule private.purge_old_reservations() manually';
  end if;
exception
  when others then
    raise notice 'Could not schedule the reservation cleanup with pg_cron (%): schedule private.purge_old_reservations() manually', sqlerrm;
end
$$;
