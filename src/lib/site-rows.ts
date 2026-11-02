// site_settings and opening_hours rows, validated with zod. Shared by the server (public
// content) and the admin panel's Adatok page, which reads the same rows in the browser.
import { z } from "zod";
import { WEEKDAYS } from "@/data/info";

/** "12:00:00" → "12:00" */
export const time = z
  .string()
  .regex(/^\d{2}:\d{2}/)
  .transform((t) => t.slice(0, 5));

const pageImageName = z.string().regex(/^[A-Za-z0-9._-]+\.webp$/);

/** One page of the menu PDF, rendered to WebP by the admin panel at upload time. */
export const menuPageRow = z.object({
  /** Large image (1600 px wide) in the "menu" bucket. */
  file: pageImageName,
  /** Small image (800 px wide) for phones. */
  small: pageImageName,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** The page's text, for screen readers. */
  text: z.string().max(20_000),
});
export type MenuPageRow = z.infer<typeof menuPageRow>;

export const siteSettingsRow = z.object({
  restaurant_name: z.string(),
  company_name: z.string(),
  company_address: z.string(),
  tax_number: z.string(),
  company_reg_number: z.string(),
  street: z.string(),
  postal_code: z.string(),
  city: z.string(),
  country: z.string(),
  phone: z.string(),
  email: z.string(),
  socials: z.array(z.object({ label: z.string(), href: z.string().url() })),
  booking_slot_minutes: z.number().int(),
  booking_duration_minutes: z.number().int(),
  booking_capacity: z.number().int(),
  booking_max_party_size: z.number().int(),
  booking_days_ahead: z.number().int(),
  booking_min_notice_minutes: z.number().int(),
  booking_hold_minutes: z.number().int(),
  menu_pdf_path: z.string().nullable(),
  menu_pdf_updated_at: z.string().nullable(),
  menu_pdf_pages: z.array(menuPageRow),
});

export const openingHourRow = z.object({
  label: z.string(),
  days: z.array(z.enum(WEEKDAYS)),
  opens: time.nullable(),
  closes: time.nullable(),
});
