/** Preserve non-enumerable Error fields and plain PostgREST error objects in diagnostics. */
export function errorDetails(error: unknown, seen = new Set<unknown>()): unknown {
  if (error === null || typeof error !== "object") return error;
  if (seen.has(error)) return "[circular]";
  seen.add(error);
  const result: Record<string, unknown> = {};
  for (const key of new Set([
    ...Object.getOwnPropertyNames(error),
    "name",
    "message",
    "cause",
    "stack",
  ])) {
    if (key in error) result[key] = errorDetails((error as Record<string, unknown>)[key], seen);
  }
  return result;
}

export function reportError(scope: string, error: unknown) {
  console.error(`[${scope}]`, JSON.stringify(errorDetails(error)));
}
