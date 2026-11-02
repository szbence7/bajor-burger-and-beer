-- Site details edited in the admin panel (Adatok): the restaurant's display name and the
-- operating company's legal details (impresszum, privacy notice, JSON-LD). Empty company
-- fields are simply not shown.
alter table public.site_settings
  add column restaurant_name text not null default 'Bajor Burger & Beer'
    check (char_length(restaurant_name) between 1 and 80),
  add column company_name text not null default '' check (char_length(company_name) <= 120),
  add column company_address text not null default '' check (char_length(company_address) <= 200),
  add column tax_number text not null default '' check (char_length(tax_number) <= 30),
  add column company_reg_number text not null default ''
    check (char_length(company_reg_number) <= 30);

-- Replaces the whole opening schedule in one transaction (the admin edits it per weekday).
-- p_rows: [{ "label": "Kedd – Csütörtök", "days": ["Tuesday", ...], "opens": "12:00",
-- "closes": "23:00" }, ...]; opens/closes null = closed. Runs with the caller's rights, so RLS
-- and the explicit check below keep it to two-factor admins.
create or replace function public.replace_opening_hours(p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.opening_hours where id is not null;
  insert into public.opening_hours (label, days, opens, closes, sort_order)
  select r ->> 'label',
         array(select jsonb_array_elements_text(r -> 'days')),
         (r ->> 'opens')::time,
         (r ->> 'closes')::time,
         ord::int
  from jsonb_array_elements(p_rows) with ordinality as t (r, ord);
end
$$;

revoke all on function public.replace_opening_hours(jsonb) from public;
grant execute on function public.replace_opening_hours(jsonb) to authenticated;
