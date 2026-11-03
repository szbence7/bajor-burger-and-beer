-- Most csapon (home page): the beers on tap right now, shown as a row of gold taps with each
-- beer's round logo on its handle. Edited by the staff in the admin panel.

-- logo: absolute URL of the uploaded logo (the "media" bucket).
create table public.taps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  logo text not null check (char_length(logo) between 1 and 500),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger taps_updated_at before update on public.taps
  for each row execute function private.set_updated_at();

revoke all on public.taps from anon, authenticated;
grant select on public.taps to anon;
grant select, insert, update, delete on public.taps to authenticated;
alter table public.taps enable row level security;

create policy "Public reads active taps" on public.taps
  for select to anon, authenticated using (is_active);
create policy "Admins manage taps" on public.taps
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
