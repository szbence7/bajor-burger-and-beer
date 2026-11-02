// Public content queries (anon key, RLS applies). Results are cached briefly per server
// process; see cache.ts.
import { z } from "zod";
import type { Beer } from "@/data/beers";
import type { GalleryItem } from "@/data/gallery";
import type { SiteInfo } from "@/data/info";
import type { Menu } from "@/data/menu";
import type { MonthlySpecial } from "@/data/specials";
import { cached } from "./cache";
import {
  beerRow,
  galleryImageRow,
  menuItemRow,
  openingHourRow,
  siteSettingsRow,
  specialRow,
  toBeer,
  toGalleryItems,
  toMenuItems,
  toSiteInfo,
  toSpecial,
} from "./mappers";
import { getSupabase } from "./supabase";

const TTL_MS = 30_000;

/** Throws on a query error, otherwise validates the rows. */
function parse<T extends z.ZodTypeAny>(
  schema: T,
  { data, error }: { data: unknown; error: unknown },
): z.infer<T> {
  if (error) throw error;
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

function getBeers(): Promise<Beer[]> {
  return cached("beers", TTL_MS, async () => {
    const rows = await getSupabase()
      .from("beers")
      .select("slug, name, style, brewery, abv, serve, sizes, image, is_house")
      .order("sort_order")
      .order("name");
    return parse(z.array(beerRow), rows).map(toBeer);
  });
}

export function getMenu(): Promise<Menu> {
  return cached("menu", TTL_MS, async () => {
    const [rows, beers] = await Promise.all([
      getSupabase()
        .from("menu_items")
        .select(
          "slug, name, description, ingredients, price, image, badges, is_featured, menu_categories!inner(kind)",
        )
        .order("sort_order")
        .order("name"),
      getBeers(),
    ]);
    return { ...toMenuItems(parse(z.array(menuItemRow), rows)), beers };
  });
}

export function getMonthlySpecials(): Promise<MonthlySpecial[]> {
  return cached("specials", TTL_MS, async () => {
    const rows = await getSupabase()
      .from("monthly_specials")
      .select("id, name, description, price, image")
      .order("sort_order")
      .order("created_at");
    return parse(z.array(specialRow), rows).map(toSpecial);
  });
}

/** Object name of the current menu PDF in the "menu" bucket, or null. */
export function getMenuPdfPath(): Promise<string | null> {
  return cached("menu-pdf", TTL_MS, async () => {
    const row = await getSupabase().from("site_settings").select("menu_pdf_path").single();
    return parse(z.object({ menu_pdf_path: z.string().nullable() }), row).menu_pdf_path;
  });
}

export function getGallery(): Promise<GalleryItem[]> {
  return cached("gallery", TTL_MS, async () => {
    const rows = await getSupabase()
      .from("gallery_images")
      .select("id, url, alt, category, is_tall")
      .order("sort_order")
      .order("created_at");
    return toGalleryItems(parse(z.array(galleryImageRow), rows));
  });
}
