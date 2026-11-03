// Database rows → the app's content types. Rows are validated with zod, so a schema change
// fails loudly here instead of rendering half-empty pages.
import { z } from "zod";
import { images, resolveImage } from "@/data/images";
import type { OpeningHour, SiteInfo } from "@/data/info";
import { openingHourRow, siteSettingsRow } from "@/lib/site-rows";
import { publicFileUrl } from "./supabase";

export { openingHourRow, siteSettingsRow };
import type { MonthlySpecial } from "@/data/specials";

export const specialRow = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().int(),
  image: z.string().nullable(),
});

export const tapRow = z.object({ id: z.string(), name: z.string(), logo: z.string() });

export function toSiteInfo(
  settings: z.infer<typeof siteSettingsRow>,
  hours: z.infer<typeof openingHourRow>[],
): SiteInfo {
  const { street, postal_code: postalCode, city, country } = settings;
  return {
    name: settings.restaurant_name,
    company: {
      name: settings.company_name,
      address: settings.company_address,
      taxNumber: settings.tax_number,
      regNumber: settings.company_reg_number,
    },
    contact: {
      address: `${postalCode} ${city}, ${street}`,
      addressParts: { street, postalCode, city, country },
      phone: settings.phone,
      email: settings.email,
      socials: settings.socials,
    },
    openingHours: hours satisfies OpeningHour[],
    booking: {
      slotMinutes: settings.booking_slot_minutes,
      durationMinutes: settings.booking_duration_minutes,
      capacity: settings.booking_capacity,
      maxPartySize: settings.booking_max_party_size,
      daysAhead: settings.booking_days_ahead,
      minNoticeMinutes: settings.booking_min_notice_minutes,
      holdMinutes: settings.booking_hold_minutes,
    },
    menuPdf:
      settings.menu_pdf_path && settings.menu_pdf_updated_at
        ? {
            updatedAt: settings.menu_pdf_updated_at,
            pages: settings.menu_pdf_pages.map((p) => ({
              src: publicFileUrl("menu", p.file),
              srcSmall: publicFileUrl("menu", p.small),
              width: p.width,
              height: p.height,
              text: p.text,
            })),
          }
        : null,
  };
}

export function toSpecial(r: z.infer<typeof specialRow>): MonthlySpecial {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    price: r.price,
    // The cards always show a photo; fall back to the hero burger.
    image: resolveImage(r.image) ?? images.burgerHero,
  };
}
