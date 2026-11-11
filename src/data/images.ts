// Only original restaurant photographs. Vite emits responsive AVIF/WebP variants.
import type { ImageSource } from "@/components/Picture";
import burgerHeroPhoto from "@/assets/burger-hero-photo.jpg?w=480;800;1200;1600&format=avif;webp&as=picture";
import placeInterior from "@/assets/place-interior.jpg?w=480;800;1280&format=avif;webp&as=picture";
import classicBeef from "@/assets/food/classic-beef.jpg?w=400;800;1280&format=avif;webp&as=picture";
import smokeyWorld from "@/assets/food/smokey-world.jpg?w=400;800;1280&format=avif;webp&as=picture";
import louVega from "@/assets/food/lou-vega.jpg?w=400;800;1280&format=avif;webp&as=picture";
import classicChick from "@/assets/food/classic-chick.jpg?w=400;800;1280&format=avif;webp&as=picture";
import montereyJack from "@/assets/food/monterey-jack.jpg?w=400;800;1280&format=avif;webp&as=picture";
import saintTropez from "@/assets/food/saint-tropez.jpg?w=400;800;1280&format=avif;webp&as=picture";
import proteinBurger from "@/assets/food/protein-burger.jpg?w=400;800;1280&format=avif;webp&as=picture";
import lazacBurger from "@/assets/food/lazac-burger.jpg?w=400;800;1280&format=avif;webp&as=picture";
import pulledPorkBaguette from "@/assets/food/pulled-pork-baguette.jpg?w=400;800;1280&format=avif;webp&as=picture";
import bajorCsulok from "@/assets/food/bajor-csulok.jpg?w=400;800;1280&format=avif;webp&as=picture";
import lavaBurger from "@/assets/food/lava-burger.jpg?w=400;800;1280&format=avif;webp&as=picture";
import brutalSmashed from "@/assets/food/brutal-smashed.jpg?w=400;800;1280&format=avif;webp&as=picture";
import bajorKolbasz from "@/assets/food/bajor-kolbasz.jpg?w=400;800;1280&format=avif;webp&as=picture";
import cezarSalata from "@/assets/food/cezar-salata.jpg?w=400;800;1280&format=avif;webp&as=picture";
import grillCsirkemell from "@/assets/food/grill-csirkemell.jpg?w=400;800;1280&format=avif;webp&as=picture";
import sztrapacska from "@/assets/food/sztrapacska.jpg?w=400;800;1280&format=avif;webp&as=picture";
import sorkorcsolyak from "@/assets/food/sorkorcsolyak.jpg?w=400;800;1280&format=avif;webp&as=picture";

export const images = {
  burgerHeroPhoto,
  placeInterior,
  classicBeef,
  smokeyWorld,
  louVega,
  classicChick,
  montereyJack,
  saintTropez,
  proteinBurger,
  lazacBurger,
  pulledPorkBaguette,
  bajorCsulok,
  lavaBurger,
  brutalSmashed,
  bajorKolbasz,
  cezarSalata,
  grillCsirkemell,
  sztrapacska,
  sorkorcsolyak,
} as const;

export type ImageSlot = keyof typeof images;

export const foodPhotos = [
  { src: images.classicBeef, alt: "Classic Beef" },
  { src: images.smokeyWorld, alt: "Smokey World" },
  { src: images.louVega, alt: "Lou Vega" },
  { src: images.classicChick, alt: "Classic Chick" },
  { src: images.montereyJack, alt: "Monterey Jack" },
  { src: images.saintTropez, alt: "Saint Tropez" },
  { src: images.proteinBurger, alt: "Protein Burger" },
  { src: images.lazacBurger, alt: "Lazac Burger" },
  { src: images.pulledPorkBaguette, alt: "Pulled Pork baguette" },
  { src: images.bajorCsulok, alt: "Bajor Csülök" },
  { src: images.lavaBurger, alt: "Láva Burger" },
  { src: images.brutalSmashed, alt: "Brutal Smashed" },
  { src: images.bajorKolbasz, alt: "Bajor Kolbász" },
  { src: images.cezarSalata, alt: "Cézár Saláta" },
  { src: images.grillCsirkemell, alt: "Grill csirkemell" },
  { src: images.sztrapacska, alt: "Sztrapacska" },
  { src: images.sorkorcsolyak, alt: "Sörkorcsolyák" },
] as const;

/** Stored image keys or staff-uploaded URLs. Retired dummy keys no longer resolve. */
export function resolveImage(value: string | null | undefined): ImageSource | undefined {
  if (!value) return undefined;
  if (Object.hasOwn(images, value)) return images[value as ImageSlot];
  if (/^https?:\/\//.test(value)) return value;
  return undefined;
}

const dishKey = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Match exact dish names only; never illustrate an unknown special with a different meal. */
export function resolveDishImage(
  value: string | null | undefined,
  name: string,
): ImageSource | undefined {
  return (
    resolveImage(value) ?? foodPhotos.find((photo) => dishKey(photo.alt) === dishKey(name))?.src
  );
}
