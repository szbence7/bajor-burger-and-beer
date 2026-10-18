import { createServerFn } from "@tanstack/react-start";

/**
 * Runtime NOINDEX flag (e.g. a staging deploy in Coolify): "1", "true" or "yes" hides the site
 * from search engines. Read on the server at request time, so no rebuild is needed to toggle it.
 */
export function isNoindexEnv(): boolean {
  const value = typeof process === "undefined" ? undefined : process.env["NOINDEX"];
  return /^(1|true|yes)$/i.test(value?.trim() ?? "");
}

/** Server function so the root loader can hand the flag to the client during hydration. */
export const getIndexing = createServerFn({ method: "GET" }).handler(() => ({
  noindex: isNoindexEnv(),
}));
