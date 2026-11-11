-- Seed: the launch content (the mock data from Phases 1–2). Idempotent: rows that already
-- exist are left alone, so re-running never overwrites edits made in the admin panel.
-- Images are keys of bundled images in src/data/images.ts.
-- PLACEHOLDER contact data and opening hours: replace before launch (see CLAUDE.md).

begin;

insert into public.site_settings (id, street, postal_code, city, country, phone, email, socials)
values (true, 'Kazinczy utca 12.', '1075', 'Budapest', 'HU',
  '+36 1 234 5678', 'hello@bajorburger.hu',
  '[{"label":"Instagram","href":"https://instagram.com"},{"label":"Facebook","href":"https://facebook.com"},{"label":"TikTok","href":"https://tiktok.com"}]'::jsonb)
on conflict (id) do nothing;

insert into public.opening_hours (label, days, opens, closes, sort_order)
select * from (values
  ('Hétfő', array['Monday'], null::time, null::time, 1),
  ('Kedd – Csütörtök', array['Tuesday', 'Wednesday', 'Thursday'], '12:00'::time, '23:00'::time, 2),
  ('Péntek', array['Friday'], '12:00'::time, '01:00'::time, 3),
  ('Szombat', array['Saturday'], '12:00'::time, '01:00'::time, 4),
  ('Vasárnap', array['Sunday'], '12:00'::time, '22:00'::time, 5)
) as v (label, days, opens, closes, sort_order)
where not exists (select 1 from public.opening_hours);

insert into public.menu_categories (slug, name, kind, sort_order) values
  ('burgerek', 'Burgerek', 'burger', 1),
  ('koretek', 'Köretek', 'side', 2),
  ('italok', 'Egyéb italok', 'drink', 3)
on conflict (slug) do nothing;

insert into public.menu_items
  (slug, category_id, name, description, ingredients, price, image, badges, is_featured, sort_order)
select v.slug, c.id, v.name, v.description, v.ingredients, v.price, v.image, v.badges, v.is_featured, v.sort_order
from (values
  ('burgerek', 'bajor-dupla', 'Bajor Dupla', 'Két smash-elt marhapogácsa, dupla cheddar, karamellizált hagyma és házi mustáros szósz.', array['2× 90 g marha', 'cheddar', 'karamellizált hagyma', 'savanyú uborka', 'mustáros majonéz', 'brióskifli'], 4290, null, array['A ház kedvence'], true, 1),
  ('burgerek', 'pokol-tuze', 'Pokol Tüze', 'Ropogós bacon, jalapeño, füstös chilis BBQ és pepper jack sajt — csak bátraknak.', array['180 g marha', 'bacon', 'jalapeño', 'pepper jack', 'chilis BBQ', 'szezámos buci'], 4590, null, array['Csípős', 'Új'], true, 2),
  ('burgerek', 'zold-perec', 'Zöld Perec', 'Grillezett halloumi és házi babpogácsa perecbuciban, rukkolával és fokhagymás szósszal.', array['babpogácsa', 'halloumi', 'paradicsom', 'rukkola', 'fokhagymás krém', 'perecbuci'], 3890, null, array['Vega'], true, 3),
  ('burgerek', 'weisswurst', 'München Classic', 'Marhapogácsa, sörben párolt hagyma, Bergkäse sajt és édes bajor mustár.', array['180 g marha', 'Bergkäse', 'sörös hagyma', 'édes mustár', 'brióskifli'], 4190, null, '{}'::text[], false, 4),
  ('burgerek', 'smoky-joe', 'Füstös Jóska', '12 órán át füstölt tépett tarja, coleslaw és whiskys BBQ mázzal.', array['pulled pork', 'coleslaw', 'whiskys BBQ', 'lilahagyma', 'brióskifli'], 4390, null, array['Új'], false, 5),
  ('burgerek', 'kerti-mezo', 'Kerti Mező', 'Sült gombás-zöldséges pogácsa, kecskesajt, mézes dió és friss saláta.', array['gombapogácsa', 'kecskesajt', 'mézes dió', 'salátamix', 'teljes kiőrlésű buci'], 3790, null, array['Vega'], false, 6),
  ('koretek', 'hasabburgonya', 'Hasábburgonya', 'Kétszer sütve, tengeri sóval, házi ketchuppal.', '{}'::text[], 1190, null, '{}'::text[], false, 1),
  ('koretek', 'truffel', 'Szarvasgombás krumpli', 'Parmezánnal, petrezselyemmel és szarvasgombaolajjal.', '{}'::text[], 1690, null, array['A ház kedvence'], false, 2),
  ('koretek', 'perec', 'Óriás bajor perec', 'Frissen sütve, Obatzda sajtkrémmel és mustárral.', '{}'::text[], 1490, null, array['Vega'], false, 3),
  ('koretek', 'hagymakarika', 'Sörtésztás hagymakarika', 'Ropogós, füstös paprikás mártogatóssal.', '{}'::text[], 1390, null, '{}'::text[], false, 4),
  ('italok', 'limo-bodza', 'Házi bodzalimonádé', '0,5 l', '{}'::text[], 990, null, '{}'::text[], false, 1),
  ('italok', 'limo-gyomber', 'Gyömbéres-citromos limonádé', '0,5 l', '{}'::text[], 990, null, '{}'::text[], false, 2),
  ('italok', 'cola', 'Coca-Cola / Zero', '0,33 l', '{}'::text[], 690, null, '{}'::text[], false, 3),
  ('italok', 'tonic', 'Fever-Tree Tonic', '0,2 l', '{}'::text[], 790, null, '{}'::text[], false, 4),
  ('italok', 'almale', 'Préselt almalé', '0,3 l', '{}'::text[], 790, null, '{}'::text[], false, 5),
  ('italok', 'spritz', 'Fröccs (hosszúlépés)', '1 dl bor + 2 dl szóda', '{}'::text[], 890, null, '{}'::text[], false, 6),
  ('italok', 'palinka', 'Szilvapálinka', '4 cl', '{}'::text[], 1290, null, '{}'::text[], false, 7),
  ('italok', 'espresso', 'Espresso', 'dupla', '{}'::text[], 690, null, '{}'::text[], false, 8)
) as v (category, slug, name, description, ingredients, price, image, badges, is_featured, sort_order)
join public.menu_categories c on c.slug = v.category
on conflict (slug) do nothing;

insert into public.beers (slug, name, style, brewery, abv, serve, sizes, is_house, sort_order) values
  ('bajor-helles', 'Bajor Helles', 'Helles Lager', 'Bajor Házi Főzde', 4.9, 'csapolt', '[{"label":"0,3 l","price":890},{"label":"0,5 l","price":1290}]'::jsonb, true, 1),
  ('bajor-weizen', 'Bajor Weizen', 'Hefeweizen', 'Bajor Házi Főzde', 5.3, 'csapolt', '[{"label":"0,3 l","price":950},{"label":"0,5 l","price":1390}]'::jsonb, true, 2),
  ('bajor-dunkel', 'Bajor Dunkel', 'Munich Dunkel', 'Bajor Házi Főzde', 5.5, 'csapolt', '[{"label":"0,3 l","price":950},{"label":"0,5 l","price":1390}]'::jsonb, true, 3),
  ('cheddar-ipa', 'Cheddar IPA', 'West Coast IPA', 'Bajor Házi Főzde', 6.4, 'csapolt', '[{"label":"0,3 l","price":1090},{"label":"0,5 l","price":1590}]'::jsonb, true, 4),
  ('monyo-flying', 'Flying Rabbit', 'American IPA', 'MONYO Brewing', 6.0, 'csapolt', '[{"label":"0,3 l","price":1190},{"label":"0,5 l","price":1690}]'::jsonb, false, 5),
  ('hedon-apa', 'Ökör APA', 'American Pale Ale', 'Hedon Sörfőzde', 5.2, 'csapolt', '[{"label":"0,3 l","price":1090},{"label":"0,5 l","price":1590}]'::jsonb, false, 6),
  ('augustiner', 'Augustiner Edelstoff', 'Export Lager', 'Augustiner-Bräu', 5.6, 'palackos', '[{"label":"0,5 l","price":1490}]'::jsonb, false, 7),
  ('rothaus-stout', 'Fekete Bárány', 'Oatmeal Stout', 'Szent András Sörfőzde', 6.8, 'palackos', '[{"label":"0,33 l","price":1390}]'::jsonb, false, 8)
on conflict (slug) do nothing;

-- Only original restaurant photography; retired demo keys must not be re-seeded.
insert into public.gallery_images (url, alt, category, is_tall, sort_order)
select * from (values
  ('placeInterior', 'A Bajor pultja és asztalai', 'Hely', false, 1),
  ('classicBeef', 'Classic Beef', 'Ételek', false, 2),
  ('smokeyWorld', 'Smokey World', 'Ételek', false, 3),
  ('louVega', 'Lou Vega', 'Ételek', false, 4),
  ('classicChick', 'Classic Chick', 'Ételek', false, 5),
  ('montereyJack', 'Monterey Jack', 'Ételek', false, 6),
  ('saintTropez', 'Saint Tropez', 'Ételek', false, 7),
  ('proteinBurger', 'Protein Burger', 'Ételek', false, 8),
  ('lazacBurger', 'Lazac Burger', 'Ételek', false, 9),
  ('pulledPorkBaguette', 'Pulled Pork baguette', 'Ételek', false, 10),
  ('bajorCsulok', 'Bajor Csülök', 'Ételek', false, 11),
  ('lavaBurger', 'Láva Burger', 'Ételek', false, 12),
  ('brutalSmashed', 'Brutal Smashed', 'Ételek', false, 13),
  ('bajorKolbasz', 'Bajor Kolbász', 'Ételek', false, 14),
  ('cezarSalata', 'Cézár Saláta', 'Ételek', false, 15),
  ('grillCsirkemell', 'Grill csirkemell', 'Ételek', false, 16),
  ('sztrapacska', 'Sztrapacska', 'Ételek', false, 17),
  ('sorkorcsolyak', 'Sörkorcsolyák', 'Ételek', false, 18)
) as v (url, alt, category, is_tall, sort_order)
where not exists (select 1 from public.gallery_images);

-- Hónap ajánlata: starts with the three burgers the home page featured before.
insert into public.monthly_specials (name, description, price, image, sort_order)
select * from (values
  ('Bajor Dupla', 'Két smash-elt marhapogácsa, dupla cheddar, karamellizált hagyma és házi mustáros szósz.', 4290, null, 1),
  ('Pokol Tüze', 'Ropogós bacon, jalapeño, füstös chilis BBQ és pepper jack sajt — csak bátraknak.', 4590, null, 2),
  ('Zöld Perec', 'Grillezett halloumi és házi babpogácsa perecbuciban, rukkolával és fokhagymás szósszal.', 3890, null, 3)
) as v (name, description, price, image, sort_order)
where not exists (select 1 from public.monthly_specials);

commit;
