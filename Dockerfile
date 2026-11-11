# syntax=docker/dockerfile:1

# ---- deps: install with bun (lockfile is bun.lock) ----
FROM oven/bun:1.4.4 AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# ---- build: Vite + Nitro node-server bundle into .output ----
FROM deps AS build
WORKDIR /app
COPY . .
# VITE_* values are inlined into the client bundle at build time.
# In Coolify, mark them as "Build Variable".
ARG VITE_SITE_URL=https://bajorburgerandbeer.hu
ENV VITE_SITE_URL=$VITE_SITE_URL
RUN bun run build

# ---- runtime: plain Node, only the self-contained .output folder ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -T 9 -qO- "http://127.0.0.1:${PORT}/api/ready" > /dev/null || exit 1
CMD ["node", ".output/server/index.mjs"]
