-- Run only through the approved staging database connection, from the repository root:
-- psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 --single-transaction -f scripts/staging-menu-migration.sql
-- No seed/reset and NO 0011: the old uploaded PDF must remain available.
set transaction isolation level repeatable read;

do $$ begin
  if not exists (select from supabase_migrations.schema_migrations where version = '0009') then
    raise exception 'Expected staging baseline migration 0009';
  end if;
  if exists (select from supabase_migrations.schema_migrations where version >= '0010') then
    raise exception 'Unexpected migration state: inspect before applying 0010';
  end if;
  if to_regclass('public.menu_books') is not null or to_regclass('public.menu_versions') is not null then
    raise exception 'Menu tables already exist: inspect schema/cache instead of replaying migration';
  end if;
end $$;

create temporary table menu_migration_settings_before on commit drop as
select md5(coalesce(jsonb_agg(to_jsonb(s) order by id)::text, '[]')) as fingerprint
from public.site_settings s;

\ir ../supabase/migrations/0010_menu_books.sql

do $$ begin
  if (select fingerprint from menu_migration_settings_before) is distinct from
     (select md5(coalesce(jsonb_agg(to_jsonb(s) order by id)::text, '[]')) from public.site_settings s) then
    raise exception 'Existing settings changed; rolling back';
  end if;
  if (select count(*) from public.menu_books) < 3 or (select count(*) from public.menu_versions) < 5 then
    raise exception 'Menu migration verification failed';
  end if;
end $$;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ('0010', 'menu_books', array['-- Applied from supabase/migrations/0010_menu_books.sql using scripts/staging-menu-migration.sql']);
notify pgrst, 'reload schema';
