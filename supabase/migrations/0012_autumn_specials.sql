-- Autumn menu supplied by the restaurant. Keep existing card IDs and omit photos
-- until photographs of these dishes are available.
create temporary table autumn_specials (
  name text, previous_name text, description text, price integer,
  spice smallint, sort_order integer
) on commit drop;

insert into autumn_specials values
  ('Minestrone leves', null, '', 1080, 0, 1),
  ('Chili Surf & Turf burger', 'Chili Surf & Tưrf burger', 'Buci, marhahúspogácsa, füstölt sajt, sweet chili garnélarák (4 db), chili lime mayo, paradicsom, friss vegyes saláta.', 4980, 1, 2),
  ('Bacon Jam Smashed burger', null, 'Buci, smashed marhahúspogácsa 2 × 110 g, füstölt sajt, tükörtojás, bacon jam, füstös mayo, chipotle BBQ, lilahagyma, csemegeuborka, jégsaláta.', 4780, 1, 3),
  ('Crispy Chick panini', null, 'Panini, crispy chick, camembert, remoulade, feketeerdei sonka, bébi spenót.', 3780, 0, 4),
  ('Gourmet burger', null, 'Buci, marhahúspogácsa, füstölt sajt, grillezett hízott kacsamáj, jalapenos barack chutney, szarvasgombás mayo, friss vegyes saláta.', 4980, 1, 5),
  ('Salvatore burger', null, 'Buci, marhahúspogácsa 2 × 110 g töltve pestos mozzarellával, füstölt sajt, pirított chorizo, fűszeres paradicsomszósz, lilahagyma, paradicsom, friss vegyes saláta.', 4640, 0, 6),
  ('Juhtúrós Smashed burger', 'Junturos Smashed burger', 'Buci, smashed marhahúspogácsa 2 × 110 g, füstölt sajt, bacon (2 db), zöldséges juhtúrókrém, paradicsom, jégsaláta.', 4680, 0, 7),
  ('Loaded Fries', null, 'Pirított marhahús, sült krumpli, kápia ragu, jalapeno, pikáns cheddar szósz, fokhagymás tejföl.', 3380, 1, 8),
  ('Gőzgombóc, mák, vaníliasodó', null, '', 1880, 0, 9),
  ('Smarni, baracklekvár', null, '', 1280, 0, 10);

update public.monthly_specials s
set name = a.name, description = a.description, price = a.price,
    image = null, spice = a.spice, sort_order = a.sort_order, is_active = true
from autumn_specials a
where s.name = a.name or s.name = a.previous_name;

insert into public.monthly_specials (name, description, price, image, spice, sort_order)
select a.name, a.description, a.price, null, a.spice, a.sort_order
from autumn_specials a
where not exists (select 1 from public.monthly_specials s where s.name = a.name);

-- Retain older offers for staff, but show only this season's menu.
update public.monthly_specials s set is_active = false
where s.is_active and not exists (select 1 from autumn_specials a where a.name = s.name);
