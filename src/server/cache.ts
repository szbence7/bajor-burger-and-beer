interface Entry {
  value: unknown;
  expires: number;
}

const entries = new Map<string, Entry>();

/**
 * Tiny in-memory TTL cache for public content, so every page view doesn't query Supabase.
 * If a refresh fails, the last good value is served (and the error logged) rather than
 * failing the page.
 */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = entries.get(key);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.value as T;
  try {
    const value = await load();
    entries.set(key, { value, expires: now + ttlMs });
    return value;
  } catch (error) {
    if (!hit) throw error;
    console.error(`Serving stale "${key}" after a failed refresh:`, error);
    return hit.value as T;
  }
}

export function clearCache() {
  entries.clear();
}
