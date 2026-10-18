// Image slots — the single place images enter the app.
// To use the restaurant's own photos, replace the files in src/assets (same filenames) or
// change the paths below. The query string makes vite-imagetools emit AVIF + WebP in several
// widths at build time, so originals can be large, full-quality exports.
import type { ImageSource } from "@/components/Picture";
import burgerHero from "@/assets/burger-hero.png?w=400;700;1024&format=avif;webp&as=picture";
import burgerSpicy from "@/assets/burger-spicy.png?w=400;700;1024&format=avif;webp&as=picture";
import burgerVeggie from "@/assets/burger-veggie.png?w=400;700;1024&format=avif;webp&as=picture";
import placeInterior from "@/assets/place-interior.jpg?w=480;800;1280&format=avif;webp&as=picture";
import placePeople from "@/assets/place-people.jpg?w=480;800;960&format=avif;webp&as=picture";
import placeTap from "@/assets/place-tap.jpg?w=480;800;960&format=avif;webp&as=picture";
import foodTable from "@/assets/food-table.jpg?w=480;800;1280&format=avif;webp&as=picture";
import eventNight from "@/assets/event-night.jpg?w=480;800;1280&format=avif;webp&as=picture";

export const images = {
  burgerHero,
  burgerSpicy,
  burgerVeggie,
  placeInterior,
  placePeople,
  placeTap,
  foodTable,
  eventNight,
} as const;

export type ImageSlot = keyof typeof images;

/**
 * Image value stored in the database: the key of a bundled image above (keeps the AVIF/WebP
 * pipeline) or an absolute URL (e.g. Supabase Storage). Anything else resolves to undefined.
 */
export function resolveImage(value: string | null | undefined): ImageSource | undefined {
  if (!value) return undefined;
  if (Object.hasOwn(images, value)) return images[value as ImageSlot];
  if (/^https?:\/\//.test(value)) return value;
  return undefined;
}
