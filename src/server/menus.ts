import { z } from "zod";
import {
  menuBookRow,
  menuBookInput,
  menuVersionInput,
  type MenuLanguage,
  type MenuVersionRow,
} from "@/lib/menu-schema";
import type { MenuBook } from "@/data/menus";
import type { AdminResult } from "@/features/admin/schema";
import { cached, clearCache } from "./cache";
import { getSupabase, getUserSupabase, publicFileUrl } from "./supabase";

export const menuImageUrl = (name: string) =>
  name.startsWith("/menus/") ? name : publicFileUrl("menu", name);

export function toMenuBook(row: z.infer<typeof menuBookRow>): MenuBook {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    versions: Object.fromEntries(
      row.menu_versions.map((version) => [
        version.language,
        version.pages.map((page) => ({
          src: menuImageUrl(page.file),
          srcSmall: menuImageUrl(page.small),
          width: page.width,
          height: page.height,
          text: page.text,
          language: version.language,
        })),
      ]),
    ),
  };
}

export function getMenuBooks(): Promise<MenuBook[]> {
  return cached("menu-books", 30_000, async () => {
    const { data, error } = await getSupabase()
      .from("menu_books")
      .select("*, menu_versions(*)")
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return z
      .array(menuBookRow)
      .parse(data)
      .map(toMenuBook)
      .filter((book) => Object.keys(book.versions).length > 0);
  });
}

const failure = { ok: false, error: "unknown" } as const;
const forbidden = { ok: false, error: "forbidden" } as const;
const success = { ok: true, data: null } as const;

export async function saveMenuBook(
  token: string,
  input: z.infer<typeof menuBookInput>,
): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const values = { title: input.title, description: input.description };
  const result = input.id
    ? await db.from("menu_books").update(values).eq("id", input.id).select("id")
    : await db
        .from("menu_books")
        .insert({ ...values, sort_order: Math.floor(Date.now() / 1000) })
        .select("id");
  if (result.error) return failure;
  if (!result.data?.length) return forbidden;
  clearCache();
  return success;
}

/** Bundled assets are immutable; only Storage objects are cleaned up after a successful save. */
export function menuFiles(versions: Pick<MenuVersionRow, "pdf_path" | "pages">[]): string[] {
  return [
    ...new Set(
      versions
        .flatMap((v) => [v.pdf_path, ...v.pages.flatMap((p) => [p.file, p.small])])
        .filter((name): name is string => !!name && !name.startsWith("/menus/")),
    ),
  ];
}

async function cleanup(db: ReturnType<typeof getUserSupabase>, files: string[]) {
  if (!files.length) return;
  try {
    const { error } = await db.storage.from("menu").remove(files);
    if (error) console.warn("Menu file cleanup failed", error.message);
  } catch {
    // The database change is already committed; cleanup must never report a failed save.
    console.warn("Menu file cleanup unavailable");
  }
}

export async function saveMenuVersion(
  token: string,
  input: z.infer<typeof menuVersionInput>,
): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const previous = await db
    .from("menu_versions")
    .select("*")
    .eq("menu_id", input.menuId)
    .eq("language", input.language)
    .maybeSingle();
  if (previous.error) return failure;
  const old = previous.data as MenuVersionRow | null;
  const values = {
    menu_id: input.menuId,
    language: input.language,
    pdf_path: input.pdfPath,
    pages: input.pages,
    updated_at: new Date().toISOString(),
  };
  // The timestamp condition prevents a stale browser from overwriting a concurrent upload.
  const result = old
    ? await db
        .from("menu_versions")
        .update(values)
        .eq("id", old.id)
        .eq("updated_at", old.updated_at)
        .select("id")
    : await db.from("menu_versions").insert(values).select("id");
  if (result.error) return failure;
  if (!result.data?.length) return forbidden;
  clearCache();
  const keep = new Set(menuFiles([values]));
  await cleanup(
    db,
    menuFiles(old ? [old] : []).filter((name) => !keep.has(name)),
  );
  return success;
}

export async function deleteMenuVersion(
  token: string,
  menuId: string,
  language: MenuLanguage,
): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const { data, error } = await db
    .from("menu_versions")
    .delete()
    .eq("menu_id", menuId)
    .eq("language", language)
    .select("*");
  if (error) return failure;
  if (!data?.length) return forbidden;
  clearCache();
  await cleanup(db, menuFiles(data as MenuVersionRow[]));
  return success;
}

export async function deleteMenuBook(token: string, id: string): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const previous = await db.from("menu_versions").select("*").eq("menu_id", id);
  if (previous.error) return failure;
  const { data, error } = await db.from("menu_books").delete().eq("id", id).select("id");
  if (error) return failure;
  if (!data?.length) return forbidden;
  clearCache();
  await cleanup(db, menuFiles(previous.data as MenuVersionRow[]));
  return success;
}
