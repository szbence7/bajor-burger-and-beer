import { z } from "zod";
import { menuPageRow } from "./site-rows";

export const MENU_LANGUAGES = ["hu", "en"] as const;
export type MenuLanguage = (typeof MENU_LANGUAGES)[number];
export const MENU_LANGUAGE_LABELS: Record<MenuLanguage, string> = { hu: "Magyar", en: "English" };

// Bundled originals are seeded once; subsequent uploads live in the menu Storage bucket.
const imageName = z.string().regex(/^(?:[A-Za-z0-9._-]+\.webp|\/menus\/[a-z-]+\.jpg)$/);
export const bookPageRow = menuPageRow.extend({ file: imageName, small: imageName });
export const menuVersionRow = z.object({
  id: z.string().uuid(),
  menu_id: z.string().uuid(),
  language: z.enum(MENU_LANGUAGES),
  pdf_path: z
    .string()
    .regex(/^[A-Za-z0-9._-]+\.pdf$/)
    .nullable(),
  pages: z.array(bookPageRow).min(1).max(40),
  updated_at: z.string(),
});
export type MenuVersionRow = z.infer<typeof menuVersionRow>;
export const menuBookRow = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  description: z.string().max(300),
  sort_order: z.number().int(),
  menu_versions: z.array(menuVersionRow),
});
export type MenuBookRow = z.infer<typeof menuBookRow>;
export const menuBookInput = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(1, "Add meg az étlap nevét.").max(80),
  description: z.string().trim().max(300),
});
export const menuVersionInput = z.object({
  menuId: z.string().uuid(),
  language: z.enum(MENU_LANGUAGES),
  pdfPath: z
    .string()
    .regex(/^[A-Za-z0-9._-]+\.pdf$/)
    .nullable(),
  pages: z.array(menuPageRow).min(1).max(40),
});
export const menuLanguageInput = z.object({
  menuId: z.string().uuid(),
  language: z.enum(MENU_LANGUAGES),
});
