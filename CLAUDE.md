# Bajor Burger and Beer — project guide

Website for **Bajor Burger and Beer** (bajorburgerandbeer.hu), a modern burger and craft beer
house in Budapest. The repo started as a Lovable design-first build; the design direction is
approved and must be preserved. See also `AGENTS.md` (Lovable sync rules: never rewrite pushed
history, keep the connected branch working).

## Language and content

- All visible UI text is **Hungarian**. Code, comments and commit messages are **English**.
- Prices in Ft with Hungarian formatting: `4 290 Ft`, `0,5 l`, `5,3%`. Use `formatFt()` from
  `src/data/info.ts`; decimals via `toLocaleString("hu-HU")`.
- `<html lang="hu">`.

## Stack (current)

- React 19 + TypeScript (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`).
- TanStack Start **with SSR** + TanStack Router file-based routes in `src/routes`, TanStack
  Query. `src/routeTree.gen.ts` is generated — never edit it.
- **Decision (Phase 2): keep SSR, do not convert to a static SPA.** Server-rendered HTML gives
  search engines and link previews (Facebook, WhatsApp, Google) real titles, OG tags and
  JSON-LD on every page, which matters for a restaurant site.
- Plain Vite 8 config (`vite.config.ts`): tanstackStart, React, Tailwind, tsconfig paths, and
  Nitro with the **`node-server` preset** (build only). No Lovable config wrapper.
- Deployment: `Dockerfile` (bun build stage, Node runtime) on Coolify. The server listens on
  `PORT` (default 3000); `GET /api/health` is the healthcheck. Run the production build
  locally with `bun run build && bun run start`.
- Tailwind CSS v4, theme in `src/styles.css` (`@theme inline` + CSS variables). shadcn/ui
- Package manager: **bun** (`bun install`, `bun run build`, `bun run lint`, `bun run test`).
- Prettier: printWidth 100, double quotes, trailing commas. Lint runs Prettier as an ESLint rule.

## Structure

- `src/routes` — file-based routes: `index` (Főoldal), `menu`, `galeria`, `foglalas`, `rolunk`,
  `api/health` (server route). `__root.tsx` holds the HTML shell, Header/Footer, 404 and error
  pages. Routes stay thin: page layout + head; logic lives in features.
- `src/components` — shared brand primitives (CtaButton, Doodle, Marquee, Reveal, PageHero,
  SectionHeader, Tag, Price, RautenPattern, HoursAndMap, RotatingBadge…);
  `src/components/layout` — Header, Footer.
- `src/features/<name>` — feature components: `menu` (MenuItemCard, BeerCard,
  FeaturedBurgerCard), `booking` (BookingForm), `gallery` (GalleryGrid, PhotoCarousel).
- `src/lib` — `utils` (`cn`), `format` (`formatNumber`, `formatFt`), `cta` (`ctaClass`),
  `error-page`, SEO helpers.
- `src/data` — content and types (`menu`, `beers`, `drinks`, `gallery`, `info`) plus
  `images.ts`. Phase 3 swaps the content for Supabase while keeping the types.
- `src/assets` — images. **All image imports go through `src/data/images.ts`**, so the
  restaurant's own photos can be swapped in one place. Never import from `@/assets` elsewhere.
- No shadcn/ui: it was removed as unused. Build new UI from the brand primitives; add a
  headless library only when a feature genuinely needs one (e.g. admin dialogs).

## Design system — keep it, enforce it everywhere

Feel: a moody evening burger and beer house crossed with a bold, playful, youthful street-food
brand. Dark, atmospheric base with loud graphic moments on top. Never a generic restaurant
template.

Colours are Tailwind theme tokens only — **no hardcoded hex in components**:

| Token | Hex | Tailwind |
| --- | --- | --- |
| background | #121110 | `bg-background` |
| surface | #1C1A18 | `bg-card` |
| border | #2E2A26 | `border-border` |
| primary (cheddar gold) | #F2A900 | `bg-primary`, `text-primary` |
| primary tint | #FFC94A | `primary-glow` |
| accent (ember red) | #D9381E | `bg-ember` — **only main CTAs and badges** |
| text | #F5EFE6 | `text-foreground` |
| muted | #A89F94 | `text-muted-foreground` |

Typography: `font-display` (Anton, ultra-heavy condensed, uppercase) for oversized headlines;
Manrope (`font-sans`) for body.

Signature elements:
- Tilted infinite marquee strips (gold, dark uppercase text, small burger/beer icons) — `Marquee`.
- Cut-out burgers overlapping giant type with a warm golden glow (`glow-gold`). Overlap is a
  stylistic touch only: **never hide whole words** of a headline or a card title, and never
  cover the header.
- Hand-drawn line doodles (burger, beer mug, pretzel, fries, hop cone) — `Doodle`, ~10% opacity.
- One or two full-width gold sections per page.
- Giant "BAJOR" wordmark in the footer.
- Bavarian diamond (Rautenmuster) — `RautenPattern` (SVG, 45° diamonds, 3–5% opacity). Use
  **only** in the footer, on the map card and as a thin divider strip. Never in the hero.
- Hero: dark background, warm golden radial glow behind the burger, subtle grain (global
  `body::after` noise).

Motion: scroll reveal (`Reveal`), marquee, hover lift with gold glow (`lift`), slight hero
parallax. All motion must respect `prefers-reduced-motion`.

## Quality bar

- Responsive at 375 / 768 / 1280 / 1920 px: no horizontal scroll, no clipped headlines.
- WCAG AA contrast; Lighthouse 90+ for performance, accessibility and SEO.
- Lazy-load and size images (`width`/`height`, WebP/AVIF where possible).
- Small, focused commits. Run `bun run build` and `bun run lint` before each commit.

## Roadmap

Work happens on `claude/redesign-fixes`, in phases, stopping for review after each:
1. Design fixes (hero, cards, pattern, doodles, beer cards, gallery carousel, responsive pass).
2. Keep TanStack Start SSR; plain Vite config, Nitro node-server, Dockerfile for Coolify,
   drop Lovable leftovers and unused shadcn/ui, restructure into
   `routes/components/features/lib/data`, server-rendered SEO + Restaurant JSON-LD,
   optimised WebP/AVIF images.
3. Supabase backend (self-hosted on Coolify): tables, migrations, seed, RLS, zod-validated
   booking. Env vars in `.env.example`; never commit secrets.
4. Protected `/admin` (Supabase Auth, admin role), Hungarian, mobile-first.
