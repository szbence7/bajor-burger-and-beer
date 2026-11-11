// Public content queries (anon key, RLS applies). Results are cached briefly per server
// process; see cache.ts.
import { z } from "zod";
import type { SiteInfo } from "@/data/info";
import type { MonthlySpecial } from "@/data/specials";
import { cached } from "./cache";
import { openingHourRow, siteSettingsRow, specialRow, toSiteInfo, toSpecial } from "./mappers";
import { getSupabase } from "./supabase";

const TTL_MS = 30_000;

/** Throws on a query error, otherwise validates the rows. */
function parse<T extends z.ZodTypeAny>(
  schema: T,
  { data, error }: { data: unknown; error: unknown },
): z.infer<T> {
  if (error) throw new Error("Public content query failed", { cause: error });
  return schema.parse(data);
}

export function getSiteInfo(): Promise<SiteInfo> {
  return cached("site-info", TTL_MS, async () => {
    const db = getSupabase();
    const [settings, hours] = await Promise.all([
      db.from("site_settings").select("*").single(),
      db
        .from("opening_hours")
        .select("label, days, opens, closes")
        .order("sort_order")
        .order("created_at"),
    ]);
    return toSiteInfo(parse(siteSettingsRow, settings), parse(z.array(openingHourRow), hours));
  });
}

export function getMonthlySpecials(): Promise<MonthlySpecial[]> {
  return cached("specials", TTL_MS, async () => {
    const rows = await getSupabase()
      .from("monthly_specials")
      .select("id, name, description, price, image, spice")
      .order("sort_order")
      .order("created_at");
    return parse(z.array(specialRow), rows).map(toSpecial);
  });
}

/** First available menu PDF, preferring Hungarian within each menu (stable QR endpoint). */
export function getMenuPdfPath(): Promise<string | null> {
  return cached("menu-pdf", TTL_MS, async () => {
    const result = await getSupabase()
      .from("menu_books")
      .select("menu_versions(pdf_path, language)")
      .order("sort_order")
      .order("created_at");
    const rows = parse(
      z.array(
        z.object({
          menu_versions: z.array(
            z.object({
              pdf_path: z.string().nullable(),
              language: z.enum(["hu", "en"]),
            }),
          ),
        }),
      ),
      result,
    );
    for (const row of rows) {
      const path =
        row.menu_versions.find((v) => v.language === "hu" && v.pdf_path)?.pdf_path ??
        row.menu_versions.find((v) => v.pdf_path)?.pdf_path;
      if (path) return path;
    }
    return null;
  });
}
