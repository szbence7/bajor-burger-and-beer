import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AdminConfig } from "./config";

let client: SupabaseClient | undefined;

/**
 * The admin panel's browser client: Supabase Auth (password + authenticator app), Realtime and
 * Storage uploads. The session lives in localStorage; RLS limits everything to two-factor
 * admins. Public pages never load this.
 */
export function initAdminSupabase(config: AdminConfig): SupabaseClient {
  client ??= createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "bajor-admin-auth" },
  });
  return client;
}

export function adminSupabase(): SupabaseClient {
  if (!client) throw new Error("Admin Supabase client used before initAdminSupabase()");
  return client;
}

/** Current access token, refreshed by supabase-js when it is about to expire. */
export async function accessToken(): Promise<string | undefined> {
  const { data } = await adminSupabase().auth.getSession();
  return data.session?.access_token;
}
