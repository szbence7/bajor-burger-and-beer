-- Menu CRUD, separate languages and RLS. Runs without changing stored content.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

create function pg_temp.menu_role(app_role text, aal text default 'aal2') returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', gen_random_uuid(), 'aal', aal, 'app_metadata', json_build_object('role', app_role))::text, true);
  set local role authenticated;
$$;
grant execute on function pg_temp.menu_role(text, text) to authenticated;

set local role anon;
select ok((select count(*) >= 3 from public.menu_books), 'visitors can read the pre-created menus');
select ok((select count(*) >= 5 from public.menu_versions), 'visitors can read independent language versions');
select throws_ok($$ insert into public.menu_books (title) values ('Unauthorized') $$, '42501', null, 'anon cannot create menus');
reset role;
select pg_temp.menu_role('admin', 'aal1');
select throws_ok($$ insert into public.menu_books (title) values ('No 2FA') $$, '42501', null, 'a password alone cannot create menus');
reset role;
select pg_temp.menu_role('user');
select throws_ok($$ insert into public.menu_books (title) values ('Not admin') $$, '42501', null, 'non-admin cannot create menus');
reset role;
select pg_temp.menu_role('admin');
select lives_ok($$ insert into public.menu_books (id, title) values ('20000000-0000-4000-8000-000000000001', 'Test menu') $$, 'two-factor admin can create a menu');
select lives_ok($$ insert into public.menu_versions (menu_id, language, pages) values ('20000000-0000-4000-8000-000000000001', 'hu', '[{"file":"hu.webp","small":"hu-sm.webp","width":1600,"height":2263,"text":"Magyar"}]') $$, 'admin can upload Hungarian independently');
select lives_ok($$ insert into public.menu_versions (menu_id, language, pages) values ('20000000-0000-4000-8000-000000000001', 'en', '[{"file":"en.webp","small":"en-sm.webp","width":1600,"height":2263,"text":"English"}]') $$, 'admin can add English independently');
select throws_ok($$ insert into public.menu_versions (menu_id, language, pages) values ('20000000-0000-4000-8000-000000000001', 'en', '[{}]') $$, '23505', null, 'only one version per language');
select throws_ok($$ insert into public.menu_versions (menu_id, language, pages) values ('20000000-0000-4000-8000-000000000001', 'de', '[{}]') $$, '23514', null, 'unsupported languages rejected');
select throws_ok($$ update public.menu_versions set pages = '[]' where menu_id = '20000000-0000-4000-8000-000000000001' and language = 'hu' $$, '23514', null, 'empty uploaded versions rejected');
update public.menu_versions set pages = '[{"file":"new.webp","small":"new-sm.webp","width":1600,"height":2263,"text":"New"}]' where menu_id = '20000000-0000-4000-8000-000000000001' and language = 'hu';
select is((select pages->0->>'text' from public.menu_versions where menu_id = '20000000-0000-4000-8000-000000000001' and language = 'en'), 'English', 'replacing Hungarian preserves English');
delete from public.menu_versions where menu_id = '20000000-0000-4000-8000-000000000001' and language = 'hu';
select is((select count(*)::int from public.menu_versions where menu_id = '20000000-0000-4000-8000-000000000001'), 1, 'removing one language preserves the other');
delete from public.menu_books where id = '20000000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.menu_versions where menu_id = '20000000-0000-4000-8000-000000000001'), 0, 'deleting a book removes its language versions');
select * from finish();
rollback;
