/**
 * Sliding-window rate limiter kept in memory. Fine for the single app container on Coolify;
 * the counts reset when the container restarts.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** Records an attempt; false when the key already used up its limit in the window. */
    attempt(key: string, now = Date.now()): boolean {
      const since = now - windowMs;
      if (hits.size > 10_000) {
        for (const [k, times] of hits) if (times.every((t) => t <= since)) hits.delete(k);
      }
      const recent = (hits.get(key) ?? []).filter((t) => t > since);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}
