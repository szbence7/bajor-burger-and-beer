// Database rows → the app's content types. Rows are validated with zod, so a schema change
// fails loudly here instead of rendering half-empty pages.
import { z } from "zod";
import { images, resolveImage } from "@/data/images";
import type { Beer } from "@/data/beers";
import type { Drink } from "@/data/drinks";
import { galleryCategories, type GalleryItem } from "@/data/gallery";
import { WEEKDAYS, type OpeningHour, type SiteInfo } from "@/data/info";
import { MENU_BADGES, type Burger, type Side } from "@/data/menu";

/** "12:00:00" → "12:00" */
const time = z
  .string()
  .regex(/^\d{2}:\d{2}/)
  .transform((t) => t.slice(0, 5));

export const siteSettingsRow = z.object({
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
});

export const openingHourRow = z.object({
  label: z.string(),
  days: z.array(z.enum(WEEKDAYS)),
  opens: time.nullable(),
  closes: time.nullable(),
});

export const menuItemRow = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  price: z.number().int(),
  image: z.string().nullable(),
  badges: z.array(z.enum(MENU_BADGES)),
  is_featured: z.boolean(),
  menu_categories: z.object({ kind: z.enum(["burger", "side", "drink"]) }),
});

export const beerRow = z.object({
  slug: z.string(),
  name: z.string(),
  style: z.string(),
  brewery: z.string(),
  abv: z.coerce.number(),
  serve: z.enum(["csapolt", "palackos"]),
  sizes: z.array(z.object({ label: z.string(), price: z.number().int() })),
  image: z.string().nullable(),
  is_house: z.boolean(),
});

export const galleryImageRow = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string(),
  category: z.enum(galleryCategories),
  is_tall: z.boolean(),
});

export function toSiteInfo(
  settings: z.infer<typeof siteSettingsRow>,
  hours: z.infer<typeof openingHourRow>[],
): SiteInfo {
  const { street, postal_code: postalCode, city, country } = settings;
  return {
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
  };
}

/** Splits menu items by their category's kind, keeping the query's order. */
export function toMenuItems(rows: z.infer<typeof menuItemRow>[]) {
  const burgers: Burger[] = [];
  const sides: Side[] = [];
  const drinks: Drink[] = [];
  for (const r of rows) {
    const kind = r.menu_categories.kind;
    if (kind === "burger") {
      burgers.push({
        id: r.slug,
        name: r.name,
        description: r.description,
        ingredients: r.ingredients,
        price: r.price,
        // Burger cards always show a photo; fall back to the hero burger.
        image: resolveImage(r.image) ?? images.burgerHero,
        badges: r.badges,
        ...(r.is_featured && { featured: true }),
      });
    } else if (kind === "side") {
      sides.push({
        id: r.slug,
        name: r.name,
        description: r.description,
        price: r.price,
        ...(r.badges.length > 0 && { badges: r.badges }),
      });
    } else {
      drinks.push({ id: r.slug, name: r.name, detail: r.description, price: r.price });
    }
  }
  return { burgers, sides, drinks };
}

export function toBeer(r: z.infer<typeof beerRow>): Beer {
  const image = resolveImage(r.image);
  return {
    id: r.slug,
    name: r.name,
    style: r.style,
    brewery: r.brewery,
    abv: r.abv,
    serve: r.serve,
    sizes: r.sizes,
    ...(r.is_house && { house: true }),
    ...(image && { image }),
  };
}

/** Rows whose image can't be resolved are dropped (logged) rather than rendered broken. */
export function toGalleryItems(rows: z.infer<typeof galleryImageRow>[]): GalleryItem[] {
  return rows.flatMap((r) => {
    const src = resolveImage(r.url);
    if (!src) {
      console.warn(`Gallery image ${r.id} has an unknown image "${r.url}"; skipped`);
      return [];
    }
    return [{ id: r.id, src, alt: r.alt, category: r.category, ...(r.is_tall && { tall: true }) }];
  });
}
