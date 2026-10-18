// Content lives in Supabase (gallery_images); see src/server/content.ts.
import type { ImageSource } from "@/components/Picture";

export const galleryCategories = ["Hely", "Ételek", "Sörök", "Események"] as const;
export type GalleryCategory = (typeof galleryCategories)[number];

export interface GalleryItem {
  id: string;
  src: ImageSource;
  alt: string;
  category: GalleryCategory;
  tall?: boolean;
}
