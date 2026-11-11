import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { isRedirect, isNotFound } from "@tanstack/react-router";
import { reportError } from "./lib/errors";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    reportError("request", error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Log original server-function failures before production serialization. Plain PostgREST
// objects otherwise bypass Error sanitization and expose database internals in SSR HTML.
const functionErrors = createMiddleware({ type: "function" }).server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (isRedirect(error) || isNotFound(error) || error instanceof Response) throw error;
    reportError("server-function", error);
    if (import.meta.env.DEV) throw error;
    throw new Error("A kérés feldolgozása sikertelen.");
  }
});

// Gzip dynamic text responses (SSR HTML, sitemap, JSON). Static assets are served
// pre-compressed by Nitro. Skipped when the response is already encoded, so a proxy
// (e.g. Coolify's Traefik) never double-compresses.
// The body is buffered first: re-wrapping Start's live SSR stream drops the connection,
// and the pages don't stream Suspense boundaries, so nothing is lost.
const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript))/;
const MIN_COMPRESS_BYTES = 1024;

const compressionMiddleware = createMiddleware().server(async ({ request, next }) => {
  const result = await next();
  const res = result.response;
  if (
    !res.body ||
    res.headers.has("content-encoding") ||
    !COMPRESSIBLE.test(res.headers.get("content-type") ?? "") ||
    !/\bgzip\b/.test(request.headers.get("accept-encoding") ?? "")
  ) {
    return result;
  }
  const body = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  headers.append("vary", "accept-encoding");
  if (body.byteLength < MIN_COMPRESS_BYTES) {
    return new Response(body, { status: res.status, statusText: res.statusText, headers });
  }
  const gzipped = await new Response(
    new Blob([body]).stream().pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
  headers.set("content-encoding", "gzip");
  headers.set("content-length", String(gzipped.byteLength));
  return new Response(gzipped, { status: res.status, statusText: res.statusText, headers });
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [functionErrors],
  requestMiddleware: [compressionMiddleware, errorMiddleware, csrfMiddleware],
}));
