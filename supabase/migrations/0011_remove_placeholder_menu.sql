-- The migrated legacy PDF was only a placeholder; keep the three real menus.
update public.site_settings as settings
set menu_pdf_path = null, menu_pdf_pages = '[]'::jsonb, menu_pdf_updated_at = null
where exists (
  select 1 from public.menu_books as book
  join public.menu_versions as version on version.menu_id = book.id
  where book.id = '10000000-0000-4000-8000-000000000004'
    and book.title = 'Korábbi feltöltött étlap'
    and version.pdf_path = settings.menu_pdf_path
);

delete from public.menu_books
where id = '10000000-0000-4000-8000-000000000004'
  and title = 'Korábbi feltöltött étlap';
