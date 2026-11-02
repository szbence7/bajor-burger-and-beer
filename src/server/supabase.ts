import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TIMEOUT_MS = 8000;

let client: SupabaseClient | undefined;
let serviceClient: SupabaseClient | undefined;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set (see .env.example)`);
  return value;
}

function create(key: string, headers?: Record<string, string>): SupabaseClient {
  return createClient(env("SUPABASE_URL"), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // Fail fast instead of hanging page renders when the database is unreachable.
    global: { fetch: fetchWithTimeout, ...(headers && { headers }) },
  });
}

/**
 * Server-side Supabase client with the anon key, so Row Level Security applies exactly as it
 * would to a visitor. URL and key are runtime env vars (no rebuild to change them).
 */
export function getSupabase(): SupabaseClient {
  client ??= create(env("SUPABASE_ANON_KEY"));
  return client;
}

/**
 * A client acting as the signed-in admin whose access token the browser sent. RLS decides
 * what it may do (only two-factor admins can change anything), so a stolen password alone
 * gets nowhere. One client per request; it holds no session.
 */
export function getUserSupabase(accessToken: string): SupabaseClient {
  return create(env("SUPABASE_ANON_KEY"), { Authorization: `Bearer ${accessToken}` });
}

/**
 * Service-role client: bypasses RLS. Only for the notification log, which no visitor or
 * admin may write. Never use it to act on a request's behalf.
 */
export function getServiceSupabase(): SupabaseClient {
  serviceClient ??= create(env("SUPABASE_SERVICE_ROLE_KEY"));
  return serviceClient;
}
