import { images } from "./images";

export type GalleryCategory = "Hely" | "Ételek" | "Sörök" | "Események";

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  category: GalleryCategory;
  tall?: boolean;
}

export const galleryCategories: GalleryCategory[] = ["Hely", "Ételek", "Sörök", "Események"];

export const gallery: GalleryItem[] = [
  { id: "g1", src: images.placeInterior, alt: "Az étterem esti belső tere", category: "Hely" },
  { id: "g2", src: images.placePeople, alt: "Baráti koccintás", category: "Események", tall: true },
  {
    id: "g3",
    src: images.foodTable,
    alt: "Burgerek, perec és sör az asztalon",
    category: "Ételek",
  },
  { id: "g4", src: images.placeTap, alt: "Csapolás a pultnál", category: "Sörök", tall: true },
  { id: "g5", src: images.eventNight, alt: "Élőzenés est", category: "Események" },
  { id: "g6", src: images.burgerHero, alt: "Bajor Dupla burger", category: "Ételek" },
  { id: "g7", src: images.placeTap, alt: "Friss Helles", category: "Sörök" },
  { id: "g8", src: images.placeInterior, alt: "Hosszú asztalok", category: "Hely", tall: true },
  { id: "g9", src: images.burgerSpicy, alt: "Pokol Tüze burger", category: "Ételek" },
];
