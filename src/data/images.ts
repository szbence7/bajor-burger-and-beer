// Image slots — replace files in src/assets with the restaurant's own photos
// (keep the same filenames, or update the imports below).
import burgerHero from "@/assets/burger-hero.png";
import burgerSpicy from "@/assets/burger-spicy.png";
import burgerVeggie from "@/assets/burger-veggie.png";
import placeInterior from "@/assets/place-interior.jpg";
import placePeople from "@/assets/place-people.jpg";
import placeTap from "@/assets/place-tap.jpg";
import foodTable from "@/assets/food-table.jpg";
import eventNight from "@/assets/event-night.jpg";

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
