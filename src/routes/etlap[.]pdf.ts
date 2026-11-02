import { createFileRoute } from "@tanstack/react-router";
import { getMenuPdfPath } from "@/server/content";

// The current PDF menu at a stable address (fine for QR codes on the tables), whatever file
// the staff uploaded last. Streamed from the public "menu" bucket, so the Supabase host stays
// out of the link.
export const Route = createFileRoute("/etlap.pdf")({
  server: {
    handlers: {
      GET: async () => {
        const path = await getMenuPdfPath();
        if (!path) return new Response("Nincs feltöltött étlap.", { status: 404 });
        const base = process.env["SUPABASE_URL"]?.replace(/\/+$/, "");
        const upstream = await fetch(
          `${base}/storage/v1/object/public/menu/${encodeURIComponent(path)}`,
          { signal: AbortSignal.timeout(15_000) },
        );
        if (!upstream.ok || !upstream.body) {
          console.error(`Menu PDF ${path} unavailable: HTTP ${upstream.status}`);
          return new Response("Az étlap most nem érhető el.", { status: 502 });
        }
        return new Response(upstream.body, {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": 'inline; filename="bajor-etlap.pdf"',
            // Short: a replaced menu should show up within a minute.
            "cache-control": "public, max-age=60",
            ...(upstream.headers.get("content-length") && {
              "content-length": upstream.headers.get("content-length")!,
            }),
          },
        });
      },
    },
  },
});
