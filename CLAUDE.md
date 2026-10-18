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
- TanStack Start (SSR) + TanStack Router file-based routes in `src/routes`, TanStack Query.
  `src/routeTree.gen.ts` is generated — never edit it.
- Vite 8 via `@lovable.dev/vite-tanstack-config` (bundles tanstackStart, React, Tailwind, Nitro
  with a Cloudflare target). Phase 2 replaces this with a plain Vite SPA build.
- Tailwind CSS v4, theme in `src/styles.css` (`@theme inline` + CSS variables). shadcn/ui
  primitives in `src/components/ui` (mostly unused by the site).
- Package manager: **bun** (`bun install`, `bun run build`, `bun run lint`, `bun run test`).
- Prettier: printWidth 100, double quotes, trailing commas. Lint runs Prettier as an ESLint rule.

## Structure

- `src/routes` — pages: `index` (Főoldal), `menu`, `galeria`, `foglalas`, `rolunk`;
  `__root.tsx` holds the shell, Header/Footer, 404 and error pages.
- `src/components/site` — brand components (Header, Footer, Marquee, Doodle, Reveal,
  BeerCard, MenuItemCard, PageHero, SectionHeader, CtaButton, Tag, RotatingBadge,
  HoursAndMap, RautenPattern).
- `src/data` — mock content (`menu`, `beers`, `drinks`, `gallery`, `info`) and `images.ts`.
- `src/assets` — images. **All image imports go through `src/data/images.ts`**, so the
  restaurant's own photos can be swapped in one place. Never import from `@/assets` elsewhere.

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
2. Static SPA on TanStack Router + Query with Vite, Dockerfile/Nixpacks for Coolify, SPA
   fallback, drop Lovable leftovers, restructure into `routes/components/features/lib/data`,
   per-page SEO + Restaurant JSON-LD.
3. Supabase backend (self-hosted on Coolify): tables, migrations, seed, RLS, zod-validated
   booking. Env vars in `.env.example`; never commit secrets.
4. Protected `/admin` (Supabase Auth, admin role), Hungarian, mobile-first.
