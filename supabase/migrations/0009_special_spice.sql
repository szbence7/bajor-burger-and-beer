-- Hónap ajánlata: how hot a dish is, shown as chili icons on its card.
-- 0 = not hot, 1 = csípős (one chili), 2 = nagyon csípős (two chilis).
alter table public.monthly_specials
  add column spice smallint not null default 0 check (spice between 0 and 2);
