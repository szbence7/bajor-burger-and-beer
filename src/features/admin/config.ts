import { createServerFn } from "@tanstack/react-start";

export interface AdminConfig {
  url: string;
  anonKey: string;
}

/**
 * Public Supabase settings for the admin panel's browser client. Runtime values, so they can
 * change without a rebuild; SUPABASE_PUBLIC_URL is for when the server reaches Supabase on an
 * internal address the browser cannot use. Kept apart from the Supabase client: the admin
 * route's loader imports it, and it must not pull supabase-js into every page's bundle.
 */
export const getAdminConfig = createServerFn({ method: "GET" }).handler((): AdminConfig => ({
  url: process.env["SUPABASE_PUBLIC_URL"] || process.env["SUPABASE_URL"] || "",
  anonKey: process.env["SUPABASE_ANON_KEY"] || "",
}));
