import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";

// Public, indexable pages. Add new pages here; /admin stays out (Phase 4).
const pages = ["/", "/menu", "/galeria", "/foglalas", "/rolunk", "/adatkezeles"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = pages.map((p) => `  <url><loc>${absoluteUrl(p)}</loc></url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
