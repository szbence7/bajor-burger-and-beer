# Bajor Burger & Beer

Website for Bajor Burger & Beer, a burger and craft beer house in Budapest
([bajorburgerandbeer.hu](https://bajorburgerandbeer.hu)).

React 19 + TypeScript, [TanStack Start](https://tanstack.com/start) (server-side rendering,
file-based routing, TanStack Query), Tailwind CSS v4, Vite 8. Production runs as a Node
server built by Nitro.

Project conventions, the design system and the roadmap are in [CLAUDE.md](./CLAUDE.md).

## Development

Requires [bun](https://bun.sh) 1.3+ and Node 22+.

```sh
bun install
bun run dev        # http://localhost:8080
bun run lint       # ESLint + Prettier
bun run test       # Vitest
```

## Production build

```sh
bun run build      # outputs .output/ (server + static assets)
bun run start      # node .output/server/index.mjs, listens on $PORT (default 3000)
```

`.output/` is self-contained; it needs no `node_modules` at runtime.

## Environment

Copy `.env.example` to `.env`. `VITE_*` variables are public and inlined at build time.

| Variable        | Purpose                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL` | Canonical origin for canonical URLs, Open Graph, JSON-LD and the sitemap                                                                 |
| `PORT`          | Runtime port of the Node server (default `3000`)                                                                                         |
| `NOINDEX`       | Runtime. `1`/`true`/`yes` adds `<meta name="robots" content="noindex">` to every page and serves `Disallow: /` from robots.txt (staging) |

## Deploying on Coolify

1. New resource → your Git repository → build pack **Dockerfile**.
2. Port: `3000`. The image has a `HEALTHCHECK` on `GET /api/health`; Coolify can use the
   same path for its health check.
3. Add `VITE_SITE_URL` as a **build variable** (it is baked into the client bundle).
   For a staging deploy, also set `NOINDEX=true` (runtime variable; toggling it needs only a
   restart, not a rebuild).
4. Point the domain at the app. Pushes to the configured branch redeploy automatically.

Responses are already gzip-compressed by the app, so the proxy's compression is optional.

## Images

All images enter through `src/data/images.ts`. Replace files in `src/assets` with the
restaurant's own photos (same filenames, or update the imports). AVIF and WebP variants in
several widths are generated at build time by `vite-imagetools`.
