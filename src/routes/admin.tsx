import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { AdminAuthGate } from "@/features/admin/auth";
import { getAdminConfig } from "@/features/admin/config";
import { initAdminSupabase } from "@/features/admin/supabase";

// Staff-only panel. Rendered in the browser only (the session lives in localStorage), kept out
// of search engines and the sitemap. Access control is Supabase Auth + RLS, not this route.
export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Bajor admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  loader: () => getAdminConfig(),
  staleTime: Infinity,
  component: AdminLayout,
});

function AdminLayout() {
  const config = Route.useLoaderData();
  const [configured] = useState(() => {
    if (!config.url || !config.anonKey) return false;
    initAdminSupabase(config);
    return true;
  });

  if (!configured) {
    return (
      <p className="flex min-h-[100svh] items-center justify-center px-4 text-center text-muted-foreground">
        Az admin felület nincs beállítva (SUPABASE_URL / SUPABASE_ANON_KEY).
      </p>
    );
  }
  return (
    <AdminAuthGate>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminAuthGate>
  );
}
