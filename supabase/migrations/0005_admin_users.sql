-- Admin accounts created from the panel: a temporary password is emailed and must be replaced
-- on first sign-in, before the authenticator app is set up.

-- app_metadata.must_change_password = true marks an account still on its temporary password.
-- Such a session is never an admin, even with a second factor, so the emailed password alone
-- can never reach any data.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      and (auth.jwt() ->> 'aal') = 'aal2'
      and not coalesce((auth.jwt() -> 'app_metadata' ->> 'must_change_password')::boolean, false),
    false
  )
$$;

-- Invitation and account-reset emails share the notification log (no reservation attached).
alter table public.notification_log drop constraint notification_log_kind_check;
alter table public.notification_log add constraint notification_log_kind_check check (kind in (
  'guest_received', 'staff_new', 'guest_confirmed', 'guest_rejected', 'guest_cancelled',
  'admin_invite', 'admin_reset'
));
