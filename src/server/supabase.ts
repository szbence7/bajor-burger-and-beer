import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TIMEOUT_MS = 8000;

let client: SupabaseClient | undefined;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

/**
 * Server-side Supabase client with the anon key, so Row Level Security applies exactly as it
 * would to a visitor. URL and key are runtime env vars (no rebuild to change them).
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_ANON_KEY"];
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set (see .env.example)");
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      // Fail fast instead of hanging page renders when the database is unreachable.
      global: { fetch: fetchWithTimeout },
    });
  }
  return client;
}
