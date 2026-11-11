import { createFileRoute } from "@tanstack/react-router";
import { getSiteInfo, getMonthlySpecials, getMenuPdfPath } from "@/server/content";
import { getMenuBooks } from "@/server/menus";
import { reportError } from "@/lib/errors";

// Unlike liveness, readiness checks the schema and public queries used by the homepage.
export const Route = createFileRoute("/api/ready")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await Promise.all([
            getSiteInfo(),
            getMonthlySpecials(),
            getMenuBooks(),
            getMenuPdfPath(),
          ]);
          return Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
        } catch (error) {
          reportError("readiness", error);
          return Response.json(
            { status: "unavailable" },
            { status: 503, headers: { "cache-control": "no-store" } },
          );
        }
      },
    },
  },
});
