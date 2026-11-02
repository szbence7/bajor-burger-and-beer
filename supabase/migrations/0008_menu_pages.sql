-- The menu PDF's pages as images, for the menu viewer on the home page. The admin panel
-- renders every page in the browser when the PDF is uploaded (a large and a small WebP per
-- page, plus the page's text for screen readers) and stores them next to the PDF in the
-- "menu" bucket, so visitors never download a PDF renderer.

-- [{ "file": "etlap-1730000000000-1.webp", "small": "etlap-1730000000000-1-sm.webp",
--    "width": 1600, "height": 2263, "text": "…" }, …] in page order; [] = no pages.
alter table public.site_settings
  add column menu_pdf_pages jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(menu_pdf_pages) = 'array'
      and jsonb_array_length(menu_pdf_pages) <= 40
      -- Plain file names only: they become part of a Storage URL.
      and not jsonb_path_exists(
        menu_pdf_pages,
        '$[*] ? (!(@.file like_regex "^[A-Za-z0-9._-]+\\.webp$")
                 || !(@.small like_regex "^[A-Za-z0-9._-]+\\.webp$"))'
      )
    );

update storage.buckets
  set allowed_mime_types = array['application/pdf', 'image/webp']
  where id = 'menu';
