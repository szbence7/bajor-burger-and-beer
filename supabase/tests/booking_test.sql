-- Booking rules, RLS, admin access and retention. Run with: bun run test:db (needs the local stack).
-- Everything runs in one transaction and is rolled back.
begin;
create extension if not exists pgtap with schema extensions;

select plan(53);

-- Start bookings, the email log and specials from a known state, whatever local data exists.
delete from public.notification_log;
delete from public.reservations;
delete from public.monthly_specials;
insert into public.monthly_specials (name, price, sort_order)
values ('Bajor Dupla', 4290, 1), ('Pokol Tüze', 4590, 2), ('Zöld Perec', 3890, 3);

-- Fixed future dates (Europe/Budapest), 8–14 days ahead: well inside the 60-day window and
-- clear of the 2-hour notice.
create temp table d as
select
  t + ((2 - extract(isodow from t)::int + 7) % 7) as tue,
  t + ((5 - extract(isodow from t)::int + 7) % 7) as fri,
  t + ((1 - extract(isodow from t)::int + 7) % 7) as mon
from (select (now() at time zone 'Europe/Budapest')::date + 8 as t) x;
grant select on d to anon, authenticated;

create function pg_temp.as_anon() returns void language sql as $$
  select set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
$$;
-- aal2 = the session passed the authenticator-app check (2FA).
create function pg_temp.as_user(app_role text, aal text default 'aal2',
                                 must_change boolean default false) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('role', 'authenticated', 'sub', gen_random_uuid(), 'aal', aal,
                      'app_metadata', json_build_object('role', app_role,
                                                        'must_change_password', must_change)
    )::text, true);
  set local role authenticated;
$$;
create function pg_temp.reset() returns void language sql as $$
  reset role;
  select set_config('request.jwt.claims', '', true);
$$;
grant execute on all functions in schema pg_temp to anon, authenticated;

-- Content visibility --------------------------------------------------------------------------
update public.beers set is_active = false where slug = 'augustiner';
select pg_temp.as_anon();
select is((select count(*)::int from public.menu_items), 18, 'anon reads all active menu items');
select is((select count(*)::int from public.beers), 7, 'anon does not see inactive beers');
select is((select count(*)::int from public.site_settings), 1, 'anon reads site settings');
select throws_ok($$ update public.beers set name = 'x' $$, '42501', null,
  'anon cannot update content');
select pg_temp.reset();

-- Slots ----------------------------------------------------------------------------------------
select pg_temp.as_anon();
select is((select min(slot_time) from public.available_slots((select tue from d), 2)),
  '12:00'::time, 'Tuesday: first slot at opening time');
select is((select max(slot_time) from public.available_slots((select tue from d), 2)),
  '21:30'::time, 'Tuesday: last slot ends by 23:00 closing');
select is((select count(*)::int from public.available_slots((select tue from d), 2)), 20,
  'Tuesday: 30-minute slots');
select is((select max(slot_time) from public.available_slots((select fri from d), 2)),
  '23:30'::time, 'Friday: closing after midnight allows a 23:30 start');
select is((select count(*)::int from public.available_slots((select mon from d), 2)), 0,
  'Monday (closed): no slots');
select is((select count(*)::int from public.available_slots(
  (now() at time zone 'Europe/Budapest')::date - 1, 2)), 0, 'past date: no slots');
select is((select count(*)::int from public.available_slots(
  (now() at time zone 'Europe/Budapest')::date + 61, 2)), 0, 'beyond 60 days: no slots');
select is((select bool_or(available) from public.available_slots((select tue from d), 9)), false,
  'party above the online maximum is never available');

-- Inserts ---------------------------------------------------------------------------------------
select lives_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  select tue, '18:00', 8, 'Teszt Elek', '+36301234567', 'teszt@example.com', now() from d
$$, 'anon can create a valid reservation');
select throws_ok($$ select * from public.reservations $$, '42501', null,
  'anon cannot read reservations');
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at, status)
  select tue, '18:00', 2, 'X', '+36301234567', 'x@example.com', now(), 'confirmed' from d
$$, '42501', null, 'anon cannot set the status');
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email)
  select tue, '18:00', 2, 'X', '+36301234567', 'x@example.com' from d
$$, 'P0001', 'consent_required', 'consent is required');
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  select tue, '12:15', 2, 'X', '+36301234567', 'x@example.com', now() from d
$$, 'P0001', 'invalid_slot', 'off-grid time is rejected');
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  select tue, '22:00', 2, 'X', '+36301234567', 'x@example.com', now() from d
$$, 'P0001', 'invalid_slot', 'booking that would run past closing is rejected');
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  select mon, '18:00', 2, 'X', '+36301234567', 'x@example.com', now() from d
$$, 'P0001', 'invalid_slot', 'closed day is rejected');
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  select tue, '18:00', 9, 'X', '+36301234567', 'x@example.com', now() from d
$$, 'P0001', 'party_too_large', 'party above the online maximum is rejected');
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  values ((now() at time zone 'Europe/Budapest')::date - 1, '18:00', 2, 'X', '+36301234567',
          'x@example.com', now())
$$, 'P0001', 'date_out_of_range', 'past date is rejected');

-- Capacity: 40 guests over overlapping 90-minute bookings -----------------------------------------
-- Fill 18:00 up to 40 guests (8 already booked above).
insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
select tue, '18:00', 8, 'Vendég ' || n, '+36301234567', 'v@example.com', now()
from d, generate_series(1, 4) n;
select is(
  (select array_agg(slot_time order by slot_time) from public.available_slots((select tue from d), 1)
   where not available),
  array['17:00', '17:30', '18:00', '18:30', '19:00']::time[],
  'every slot whose 90 minutes overlap the full 18:00 window is unavailable');
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  select tue, '18:30', 1, 'X', '+36301234567', 'x@example.com', now() from d
$$, 'P0001', 'slot_full', 'overlapping booking beyond capacity is rejected');
select lives_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  select tue, '19:30', 8, 'X', '+36301234567', 'x@example.com', now() from d
$$, 'a booking starting when the 18:00 bookings end is accepted');
select pg_temp.reset();

-- A rejected booking frees its seats.
select pg_temp.as_user('admin');
update public.reservations set status = 'rejected' where name = 'Vendég 1';
select isnt((select status_changed_at from public.reservations where name = 'Vendég 1'), null,
  'a status change is timestamped');
select pg_temp.as_anon();
select lives_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  select tue, '18:30', 8, 'Pótló', '+36301234567', 'p@example.com', now() from d
$$, 'seats of a rejected booking can be booked again');
select pg_temp.reset();
select pg_temp.as_user('admin');
select is(public.capacity_overflow((select id from public.reservations where name = 'Vendég 1')),
  8, 're-accepting the rejected booking would put the window 8 guests over capacity');
select pg_temp.reset();
select pg_temp.as_anon();
select throws_ok($$ select public.capacity_overflow(gen_random_uuid()) $$, '42501', null,
  'anon cannot check capacity');
select pg_temp.reset();

-- Minimum notice -------------------------------------------------------------------------------
update public.site_settings set booking_min_notice_minutes = 10080;
select pg_temp.as_anon();
select throws_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at)
  values ((now() at time zone 'Europe/Budapest')::date + 2, '19:00', 2, 'X', '+36301234567',
          'x@example.com', now())
$$, 'P0001', null, 'booking inside the minimum notice is rejected');
select pg_temp.reset();
update public.site_settings set booking_min_notice_minutes = 120;

-- Authenticated users ----------------------------------------------------------------------------
select pg_temp.as_user('');
select is((select count(*)::int from public.reservations), 0,
  'a non-admin user sees no reservations');
select pg_temp.reset();

select pg_temp.as_user('admin', 'aal1');
select is((select count(*)::int from public.reservations), 0,
  'an admin without the second factor sees no reservations');
update public.monthly_specials set name = 'Feltört';
select is((select count(*)::int from public.monthly_specials where name = 'Feltört'), 0,
  'an admin without the second factor cannot edit the monthly specials');
select pg_temp.reset();

select pg_temp.as_user('admin', 'aal2', true);
select is((select count(*)::int from public.reservations), 0,
  'an admin still on the emailed temporary password sees nothing, even with 2FA');
select pg_temp.reset();

select pg_temp.as_user('admin');
select is((select count(*)::int from public.reservations), 7, 'admin sees all reservations');
select lives_ok($$
  insert into public.reservations (date, time, party_size, name, phone, email, consent_at, status)
  select tue, '18:00', 12, 'Telefonos', '+36301234567', 't@example.com', now(), 'confirmed' from d
$$, 'admin can add a phone booking beyond the online rules');
select pg_temp.reset();

-- Hónap ajánlata, notification log, PDF menu, storage --------------------------------------------
select pg_temp.as_user('admin');
update public.monthly_specials set is_active = false where name = 'Zöld Perec';
select lives_ok($$
  insert into public.monthly_specials (name, description, price) values ('Novemberi', '', 3990)
$$, 'admin can add a monthly special');
select pg_temp.reset();
select pg_temp.as_anon();
select is((select count(*)::int from public.monthly_specials), 3,
  'anon reads only active monthly specials');
select pg_temp.reset();

-- Most csapon
delete from public.taps;
select pg_temp.as_user('admin', 'aal1');
select throws_ok($$
  insert into public.taps (name, logo) values ('Feltört', 'https://x.hu/a.webp')
$$, '42501', null, 'an admin without the second factor cannot add a tap');
select pg_temp.reset();
select pg_temp.as_user('admin');
select lives_ok($$
  insert into public.taps (name, logo, is_active) values
    ('Bajor Világos', 'https://x.hu/a.webp', true), ('Rejtett', 'https://x.hu/b.webp', false)
$$, 'admin can add taps');
select pg_temp.reset();
select pg_temp.as_anon();
select is((select array_agg(name)::text from public.taps), '{"Bajor Világos"}',
  'anon reads only active taps');
select throws_ok($$ select * from public.notification_log $$, '42501', null,
  'anon cannot read the notification log');
select pg_temp.reset();

select pg_temp.as_user('admin', 'aal1');
select is((select count(*)::int from public.notification_log), 0,
  'an admin without the second factor cannot read the notification log');
select pg_temp.reset();
insert into public.notification_log (reservation_id, kind, recipient, status)
select id, 'guest_received', email, 'sent' from public.reservations where name = 'Teszt Elek';
select pg_temp.as_user('admin');
select is((select count(*)::int from public.notification_log), 1, 'admin reads the notification log');
select pg_temp.reset();

select throws_ok($$ update public.site_settings set menu_pdf_path = '../x.pdf' $$, '23514', null,
  'the menu PDF path must be a plain file name');
select is((select array_agg(id order by id) from storage.buckets where public), array['media', 'menu'],
  'public buckets for images and the menu PDF exist');
select throws_ok($$ update public.site_settings set menu_pdf_pages = '[{"file":"../x.webp","small":"x-sm.webp"}]' $$,
  '23514', null, 'menu page images must be plain file names');
select lives_ok($$ update public.site_settings set menu_pdf_pages =
  '[{"file":"etlap-1-1.webp","small":"etlap-1-1-sm.webp","width":1600,"height":2263,"text":""}]' $$,
  'menu pages with plain WebP names are accepted');
select is((select allowed_mime_types from storage.buckets where id = 'menu'),
  array['application/pdf', 'image/webp'], 'the menu bucket takes the PDF and its page images');

-- Opening hours editing ---------------------------------------------------------------------------
select pg_temp.as_anon();
select throws_ok($$ select public.replace_opening_hours('[]') $$, '42501', null,
  'anon cannot replace the opening hours');
select pg_temp.reset();
select pg_temp.as_user('admin', 'aal1');
select throws_ok($$ select public.replace_opening_hours('[]') $$, '42501', null,
  'an admin without the second factor cannot replace the opening hours');
select pg_temp.reset();
select pg_temp.as_user('admin');
select public.replace_opening_hours('[
  {"label":"Hétfő – Vasárnap","days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"opens":"10:00","closes":"20:00"}
]');
select is((select min(slot_time) from public.available_slots((select mon from d), 2)),
  '10:00'::time, 'replaced opening hours drive the bookable slots at once');
select pg_temp.reset();

-- Retention ---------------------------------------------------------------------------------------
insert into public.reservations (date, time, party_size, duration_minutes, name, phone, email,
                                 consent_at)
values (current_date - interval '13 months', '18:00', 2, 90, 'Régi', '+36301234567',
        'r@example.com', now()),
       (current_date - interval '11 months', '18:00', 2, 90, 'Friss', '+36301234567',
        'f@example.com', now());
select is(private.purge_old_reservations(), 1, 'purge deletes only reservations older than 12 months');
select is((select count(*)::int from cron.job where jobname = 'bajor-purge-old-reservations'), 1,
  'daily cleanup is scheduled with pg_cron');

select * from finish();
rollback;
