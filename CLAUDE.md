# Bajor Burger and Beer — project guide

Always read docs/PLAN.md first. Update its Status section at the end of every phase.

Website for **Bajor Burger and Beer** (bajorburgerandbeer.hu), a modern burger and craft beer
house in Budapest. The repo started as a Lovable design-first build; the design direction is
approved and must be preserved. Since Phase 2 the Lovable build wrapper is gone, so the Lovable
editor can no longer build this code; development continues outside Lovable. `AGENTS.md` still
applies: never rewrite pushed history.

## Workflow

- Work on branch `claude/redesign-fixes` (never directly on `main`), in phases.
- After each phase: run the full verification (below), commit, **push the branch without
  asking**, summarise, then **stop for the user's review** before the next phase.
- Small, focused commits with clear English messages. Never force-push; never push to `main`
  without asking.
- Verification before every commit: `bun run lint` (0 errors), `bunx tsc --noEmit`,
  `bun run test`, `bun run build`. For UI changes also check screenshots at 375 / 768 / 1280 /
  1920 px (no horizontal scroll, no clipped headings) and compare against the previous look.
  Verify a fix visually before reporting it as fixed.

## Language and content

- All visible UI text is **Hungarian**. Code, comments and commit messages are **English**.
- Prices in Ft with Hungarian formatting: `4 290 Ft`, `0,5 l`, `5,3%`. Render prices with
  `<Price value={…} />` (always groups thousands with a non-breaking space, keeps "Ft"
  mixed-case inside uppercase display type). For plain text use `formatFt()` /
  `formatNumber()` from `src/lib/format.ts` (`toLocaleString("hu-HU")` does **not** group
  4-digit numbers). Decimals via `toLocaleString("hu-HU")`.
- `<html lang="hu">`.

## Placeholder content — replace before launch

`NOINDEX=true` must stay on any public deploy until these are real:

- `site_settings` + `opening_hours` (seeded from `supabase/seed.sql`): address (Kazinczy
  utca 12., 1075 Budapest), phone (+36 1 234 5678), email (hello@bajorburger.hu), social links
  (bare network homepages, so they are left out of JSON-LD `sameAs` until they are real
  profile URLs), opening hours, booking rules (capacity 40 etc., to confirm with the
  restaurant). These feed the footer, contact cards, booking form **and the Restaurant
  JSON-LD**.
- Menu, beers, prices and gallery in the seed are the old mock content (some photos reused).
- `/adatkezeles` privacy notice is placeholder text; the user will supply the final version.
- `src/assets/*`: AI-generated stand-in photos; `public/og-image.jpg` is rendered from the
  hero burger and the logo. Regenerate the OG image once real photos exist.
- `MapPlaceholder` ("Térkép helye") stands in for a real map embed.
- JSON-LD `priceRange: "$$"` and `servesCuisine` in `src/lib/structured-data.ts`.

## Stack and runtime

- React 19 + TypeScript (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `noPropertyAccessFromIndexSignature` → use `process.env["X"]`).
- **TanStack Start with SSR** + TanStack Router file-based routes (`src/routes`) + TanStack
  Query. `src/routeTree.gen.ts` is generated — never edit it.
- **Decision (Phase 2): keep SSR, do not convert to a static SPA.** Server-rendered HTML gives
  search engines and link previews real titles, OG tags and JSON-LD on every page.
- Plain Vite 8 config (`vite.config.ts`): tailwindcss, vite-imagetools, tsconfig paths,
  tanstackStart (import protection: `**/server/**` and `server-only` blocked from the client),
  React, and Nitro **`node-server` preset** (build only, `compressPublicAssets`). Dev server
  runs on port 8080.
- `bun run build` → self-contained `.output/` (no `node_modules` needed);
  `bun run start` = `node .output/server/index.mjs`, listens on `PORT` (default 3000).
- `src/start.ts` request middleware: gzip for dynamic text responses (the body is
  **buffered** first — re-wrapping Start's live SSR stream drops the connection), a branded
  Hungarian fallback error page (`src/lib/error-page.ts`), and CSRF protection for server
  functions.
- Server routes: `/api/health` (healthcheck), `/sitemap.xml`, `/robots.txt`.
- Fonts are self-hosted via Fontsource (`@fontsource/anton`, `@fontsource-variable/manrope`);
  latin subsets are preloaded in `__root.tsx`. Don't reintroduce Google Fonts links.
- Tailwind CSS v4, theme tokens in `src/styles.css` (`@theme inline` + CSS variables).
- No shadcn/ui (removed as unused in Phase 2, with its Radix etc. dependencies). Build UI from
  the brand primitives; add a headless library only when a feature genuinely needs one (e.g.
  admin dialogs).
- Data: self-hosted Supabase via `@supabase/supabase-js`, **server-side only** in Phase 3
  (`src/server/supabase.ts`, anon key, so RLS applies). Pages load content in route loaders
  through server functions; the browser never talks to Supabase. Inputs and DB rows are
  validated with `zod`. Supabase CLI runs via `bunx supabase@2.121.0` (package scripts
  `db:*`, `test:db`); it is not a dependency.
- Package manager: **bun** (`bun.lock`, `bunfig.toml` has a 24 h minimum-release-age guard).
- Prettier: printWidth 100, double quotes, trailing commas. ESLint runs Prettier as a rule.

## Environment variables

| Variable            | When       | Purpose                                                                                                                                 |
| ------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL`     | build time | Canonical origin for canonical URLs, OG, JSON-LD, sitemap, robots. Defaults to `https://bajorburgerandbeer.hu`. Coolify: build variable |
| `PORT`              | runtime    | Node server port (default 3000)                                                                                                         |
| `NOINDEX`           | runtime    | `1`/`true`/`yes` → `<meta name="robots" content="noindex">` on every page and `Disallow: /` in robots.txt. For staging                  |
| `SUPABASE_URL`      | runtime    | Supabase API URL. Server-only (read via `process.env`)                                                                                  |
| `SUPABASE_ANON_KEY` | runtime    | Supabase anon key. Server-only                                                                                                          |
| `SUPABASE_DB_URL`   | local only | Postgres URL (SSH tunnel) for `bun run db:push`. Never in Coolify or git                                                                |

`VITE_*` values are public (inlined into the client bundle). Secrets never go in `VITE_*` or
in git; `.env` is gitignored, `.env.example` is the template. NOINDEX is read on the server
(`src/lib/indexing.ts`) and passed to the client through the root route's loader
(5 min `staleTime`, together with the site info), so the meta tag survives client-side
navigation. In dev, `vite.config.ts` fills `SUPABASE_*`/`NOINDEX` from `.env` (production
reads the real environment).

## Deployment (Coolify on the user's VPS)

- `Dockerfile`: `oven/bun:1.4` installs deps (`--frozen-lockfile`) and builds; the runtime
  stage is `node:22-alpine` running as `node`, copying only `.output/`. `EXPOSE 3000`,
  `HEALTHCHECK` on `/api/health` via `wget`. Image ≈ 240 MB. `.dockerignore` excludes
  `node_modules`, `.output`, `.env*`.
- Coolify: Dockerfile build pack, port 3000, `VITE_SITE_URL` as build variable, `NOINDEX=true`
  on staging, `SUPABASE_URL` + `SUPABASE_ANON_KEY` as runtime variables. Git push
  auto-deploys. The rate limiter trusts `X-Real-IP` / the last `X-Forwarded-For` entry as set
  by Coolify's Traefik.
- The Phase 2 image was verified locally: all pages 200, unknown routes 404, AVIF served,
  container reports `healthy`, `PORT` and `NOINDEX` respected.

## Structure

- `src/routes` — `index` (Főoldal), `menu`, `galeria`, `foglalas`, `rolunk`, `adatkezeles`
  (privacy notice, placeholder), server routes
  `api/health`, `sitemap[.]xml`, `robots[.]txt`. `__root.tsx` holds the HTML shell, root head
  (fonts, icons, OG defaults, JSON-LD, NOINDEX), Header/Footer, 404 and error components.
  Routes stay thin: layout + `head`; logic lives in features.
- `src/components` — shared brand primitives: CtaButton (`CtaLink`), Doodle, Marquee, Reveal,
  RotatingBadge, PageHero, SectionHeader, Tag, Price, Picture, BrandLogo, RautenPattern
  (+ `RautenDivider`), HoursAndMap (`HoursCard`, `MapPlaceholder`).
  `src/components/layout` — Header, Footer.
- `src/features/menu` — MenuItemCard, BeerCard, FeaturedBurgerCard.
  `src/features/booking` — BookingForm (two steps + confirmation; currently client-only).
  `src/features/gallery` — GalleryGrid (filters + lightbox), PhotoCarousel (Embla). Each
  feature's `api.ts` holds its server functions (`getMenuContent`, `getHomeContent`,
  `getGalleryContent`, `getAvailability`, `createReservation`); `booking/schema.ts` is the
  shared zod schema + error codes.
- `src/server` — server-only (import protection blocks it from the client): `supabase`
  client, `content` queries (30 s in-memory cache, stale value on error), `mappers` (rows →
  types), `booking` (availability, submit, honeypot, 5/IP/hour rate limit), `notifications`
  (`onReservationCreated` hook, empty), `request` (client IP).
- `src/lib` — `utils` (`cn`), `format` (`formatNumber`, `formatFt`, `formatHours`), `cta`
  (`ctaClass`, variants), `site` (`SITE_URL`, `SITE_NAME`, `DEFAULT_OG_IMAGE`, `absoluteUrl`),
  `seo`, `structured-data`, `indexing`, `error-page`, `site-info` (`getSiteInfoFn`, root loader
  data via `useSiteInfo()`), `date` (Budapest today, Hungarian date format).
- `src/data` — the content **types** (`menu`, `beers`, `drinks`, `gallery`, `info`) and
  `images.ts` (+ `resolveImage()`: DB image value = bundled image key or absolute URL). The
  content itself lives in Supabase.
- `supabase/` — numbered migrations, `seed.sql`, pgTAP tests, local CLI config; runbook in
  `supabase/README.md` (roles, booking rules, applying to the real instance, GDPR cleanup).
  `OpeningHour` is structured (`label`, `days: Weekday[]`, `opens`, `closes`; null = closed;
  `closes < opens` = after midnight) because it drives both the UI and the JSON-LD.
- `src/assets` — source images. `public/` — `logo.svg`, favicons (`favicon.svg/.ico`, `apple-touch-icon`,
  `icon-192/512`), `site.webmanifest`, `og-image.jpg` (1200×630).
- `src/env.d.ts` types `import.meta.env`; `src/imagetools.d.ts` types imagetools imports.

## Image pipeline

- **All images enter through `src/data/images.ts`** — never import from `@/assets` elsewhere.
  Each import has a vite-imagetools query, e.g.
  `@/assets/burger-hero.png?w=400;700;1024&format=avif;webp&as=picture`, which emits AVIF +
  WebP at those widths at build time (no original PNG/JPG is published). Don't request widths
  larger than the source.
- Render with `<Picture image={…} alt="…" sizes="…" />`; give `sizes` matching the rendered
  width. Default `loading="lazy"`; the hero burger uses `loading="eager"` +
  `fetchPriority="high"`, and both hero instances share the same `sizes` so only one file
  downloads.
- `ImageSource = PictureData | string`: plain URLs (Supabase Storage in Phase 3/4) render as a
  normal `<img>`.
- To swap in the restaurant's photos, replace files in `src/assets` (same names) or edit the
  imports in `images.ts`.

## SEO

- Every route's `head` is `seo({ path, title, description })` from `src/lib/seo.ts` (title,
  description, canonical, `og:*` incl. image size/alt, `twitter:*`). Descriptions ~110–160
  characters, Hungarian.
- Root head: charset, viewport, theme-color, `og:type/site_name/locale (hu_HU)`, twitter card,
  icons, manifest, schema.org `Restaurant` JSON-LD (`restaurantJsonLd()`: address, phone,
  email, opening hours, `hasMenu`, `acceptsReservations` → /foglalas). Data comes from
  `src/data/info.ts` so UI and JSON-LD never disagree — keep it that way when moving to
  Supabase.
- `/adatkezeles` is in the sitemap. New public pages must be added to the list in
  `src/routes/sitemap[.]xml.ts`. `/admin`
  (Phase 4) must stay out of the sitemap and be noindexed.
- Lighthouse (mobile, production build, end of Phase 2): performance 93–98, accessibility /
  best practices / SEO 100 on all five pages. Don't regress it.

## Design system — keep it, enforce it everywhere

Feel: a moody evening burger and beer house crossed with a bold, playful, youthful street-food
brand. Dark, atmospheric base with loud graphic moments on top. Never a generic restaurant
template.

Colours are Tailwind theme tokens only — **no hardcoded hex in components** (the
self-contained `error-page.ts` and generated brand assets are the only exceptions):

| Token               | Hex     | Tailwind                     |
| ------------------- | ------- | ---------------------------- |
| background          | #121110 | `bg-background`              |
| surface             | #1C1A18 | `bg-card`                    |
| border              | #2E2A26 | `border-border`              |
| primary (logo gold) | #D2AC66 | `bg-primary`, `text-primary` |
| primary tint        | #E6C88A | `primary-glow`               |
| accent (ember red)  | #D9381E | `bg-ember`                   |
| text                | #F5EFE6 | `text-foreground`            |
| muted               | #A89F94 | `text-muted-foreground`      |

- Ember is **only for main CTAs and badges**. Text on ember is pure white
  (`ember-foreground`, 4.6:1 AA); never use ember as a text colour on dark (3.6:1, fails).
- Typography: `font-display` (Anton, ultra-heavy condensed, uppercase) for oversized
  headlines; Manrope (`font-sans`) for body. `font-display` sets a 1.12 line pitch (via
  `--tw-leading`, so it wins over `text-4xl…8xl`) because Anton's accented capitals (É, Á, Ü
  reach ~1.10em, Ő/Ű ~1.17em above the baseline) otherwise hit the line above ("PQKOL").
  Use a tighter explicit `leading-*` only for fixed, accent-safe copy (hero: 0.94).

Signature elements:

- Tilted infinite marquee strips (gold, dark uppercase text, small burger/beer icons) —
  `Marquee`.
- Cut-out burgers overlapping giant type with a warm golden glow (`glow-gold`). Overlap is a
  stylistic touch only: **never hide whole words** and never cover the header.
  - Home hero geometry: on md+ the burger sits in a flex slot right after "Csapolt sör.",
    sized in `em` of the headline (`w-[2.6em]`, `xl:w-[2.2em]`, `-bottom-[0.3em]`); the h1
    reserves `md:pt-[1.05em]` above itself so the burger never reaches the fixed header. On
    mobile the burger sits above the stacked headline. Parallax is a rAF-throttled `translate`
    on that slot. Re-check 375/768/1024/1280/1920 if you touch it.
  - Featured burger cards: the title is `relative z-10` above the image layer; the image sits
    lower in its own flex area.
- Hand-drawn line doodles (burger, mug, foam, pretzel, fries, hop) — `Doodle`, default
  **10% opacity, used large** (`h-28`–`h-56`) as texture in dark sections (user decision).
  On gold/ember sections they use the section's foreground colour at ~20%.
- One or two full-width gold sections per page.
- Giant "BAJOR" wordmark in the footer.
- **The logo is fixed** (B² + vertical "BURGER & BEER", gold #D2AC66 + cream #E2CCA8 on black):
  never recolour, crop or redraw it. `public/logo.svg` is a trace of
  `docs/brand/logo-original.png`; render it with `<BrandLogo>` (header: logo + "Bajor"
  wordmark; footer: large logo). The favicons and app icons use the gold B² mark only (the
  vertical text is illegible at icon sizes). The primary token is the logo's gold.
- Bavarian diamond (Rautenmuster) — `RautenPattern`: crisp 45° diamonds as an SVG mask in
  currentColor, 4–5% opacity. **Only** in the footer, on the map card, and as
  `RautenDivider` (16 px strip at 12% — user approved). Never in the hero or other sections.
- Hero: no pattern; dark background, golden radial glow behind the burger, global grain
  (`body::after` noise).
- Photo carousel (home "A hely"): rounded-3xl cards alternating `-rotate-2` / `rotate-2`,
  straightening and lifting on hover.

Motion: scroll reveal (`Reveal`), marquee, hover lift with gold glow (`lift`), hero float and
parallax. All motion respects `prefers-reduced-motion` (CSS block at the end of
`styles.css`; parallax checks `matchMedia`).

## Quality bar

- Responsive at 375 / 768 / 1280 / 1920 px (also sanity-check 320 and 1024): no horizontal
  scroll, no clipped headlines, readable marquees, usable forms.
- WCAG AA contrast, labelled form fields, sequential heading order (footer column titles are
  `h2`).
- Lighthouse 90+ for performance, accessibility and SEO on the production build.
- Images via the pipeline above.

## Roadmap

Phases 1–2 are done (design fixes; SSR on Node, Docker, cleanup, structure, images, SEO,
NOINDEX). Phase 3 (Supabase) is implemented; see docs/PLAN.md for status and the agreed
booking/GDPR decisions. Phase specs as given by the user:

### Phase 3 — Supabase backend

The user self-hosts Supabase on Coolify. Use env vars for the URL and anon key (add them to
`.env.example`; never commit secrets).

- Replace the mock data in `src/data` with Supabase tables, keeping the same TypeScript types:
  - `menu_categories`, `menu_items` (burgers, sides, other drinks: name, description,
    ingredients, price, image, badges, sort order, is_active)
  - `beers` (name, style, brewery, ABV, tap or bottle, size/price options, image, is_active)
  - `gallery_images` (url, category: hely / ételek / sörök / események, sort order)
  - `opening_hours`, `site_settings` (address, phone, email, socials)
  - `reservations` (date, time slot, party size, name, phone, email, note,
    status: pending / confirmed / cancelled, created_at)
- SQL migrations and a seed script that loads the current mock content.
- Row Level Security: public can read active menu, beers, gallery and settings; public can only
  INSERT reservations (no reading other people's bookings); admin role has full access.
- Booking: validate with zod; only offer time slots within opening hours; block past dates;
  show a clear confirmation screen. Leave a clean hook point for email notifications (added
  later).
- Keep SSR working: load data in route loaders / TanStack Query so pages, JSON-LD and OG stay
  server-rendered. Keep `opening_hours` compatible with the structured `OpeningHour` type.

### Phase 4 — Admin panel

A protected `/admin` area (Supabase Auth, email + password, admin role only) in the same
design language but calmer and practical. Hungarian UI, mobile-friendly (staff use phones):

- Reservations: list and calendar/day view, filter by date and status, confirm or cancel.
- Menu and beers: create, edit, reorder, toggle active, upload images to Supabase Storage.
- Gallery: upload, categorise, reorder, delete.
- Opening hours and contact details editing.

## Gotchas

- In zsh, quote paths with brackets: `"src/routes/sitemap[.]xml.ts"`.
- The SSR HTML is one long line; `grep -o`/`-c` on it is unreliable here — parse with Python.
- Full-page screenshots show a horizontal band where the fixed grain overlay ends; it is a
  capture artefact, not a bug.
