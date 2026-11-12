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

/** A dish photo with its name and contents, as printed on the restaurant's menu. */
export interface DishPhoto {
  src: ImageSource;
  alt: string;
  description: string;
}

// Names and descriptions follow the printed Hungarian menu (public/menus/etlap-hu.jpg).
export const foodPhotos: readonly DishPhoto[] = [
  {
    src: images.classicBeef,
    alt: "Classic Beef",
    description: "Buci, marhahúspogácsa, cheddar sajt, házi hamburger szósz, paradicsom, jégsaláta",
  },
  {
    src: images.smokeyWorld,
    alt: "Smokey World",
    description:
      "Buci, marhahúspogácsa, bacon, füstölt sajt, BBQ szósz, házi hamburger szósz, paradicsom, jégsaláta",
  },
  {
    src: images.louVega,
    alt: "Lou Vega",
    description: "Buci, grill camembert, paradicsom, házi hamburger szósz, jégsaláta",
  },
  {
    src: images.classicChick,
    alt: "Classic Chick",
    description:
      "Buci, grill csirkemell, cheddar sajt, házi hamburger szósz, paradicsom, jégsaláta",
  },
  {
    src: images.montereyJack,
    alt: "Monterey Jack",
    description:
      "Buci, marhahúspogácsa, bacon, házi hamburger szósz, cheddar sajt, jalapeno paprika, paradicsom, jégsaláta",
  },
  {
    src: images.saintTropez,
    alt: "Saint-Tropez",
    description:
      "Buci, marhahúspogácsa, cheddar sajt, camembert, házi hamburger szósz, paradicsom, jégsaláta",
  },
  {
    src: images.proteinBurger,
    alt: "Protein Burger",
    description:
      "Marhahúspogácsa, bacon, cheddar sajt, pirított hagyma, házi hamburger szósz, paradicsom, extra jégsaláta, buci nélkül",
  },
  {
    src: images.lazacBurger,
    alt: "Lazacburger",
    description: "Buci, grill lazac, caesar szósz, aszalt paradicsom, friss vegyes saláta",
  },
  {
    src: images.pulledPorkBaguette,
    alt: "Pulled pork baguette",
    description:
      "Pulled pork, cheddar sajt, bacon, BBQ szósz, fokhagymás mayo, aszalt paradicsom, savanyú uborka, pirított hagyma, jégsaláta",
  },
  {
    src: images.bajorCsulok,
    alt: "Bajor csülök",
    description: "Sörben sült ropogós csülök, bajor káposzta, fűszeres, fokhagymás steak burgonya",
  },
  {
    src: images.lavaBurger,
    alt: "Láva Burger",
    description:
      "Buci, marhahúspogácsa, füstölt sajt, bacon, jalapeno, pirított hagyma, fokhagymás mayo, folyékony cheddar sajt, paradicsom, jégsaláta",
  },
  {
    src: images.brutalSmashed,
    alt: "Brutal Smashed Burger",
    description:
      "Buci, smashed marhahúspogácsa 2×110 g, cheddar sajt, pikáns cheddar sajtszósz, smashed szósz, bacon 2 db, sült lilahagyma, csemegeuborka, friss vegyes saláta",
  },
  {
    src: images.bajorKolbasz,
    alt: "Bajor kolbász",
    description: "Grill bajor kolbász (3 db), sült édesburgonya, dijoni mustár, bajor káposzta",
  },
  {
    src: images.cezarSalata,
    alt: "Caesar saláta",
    description:
      "Grill csirkemell, parmezán sajt, caesar szósz, friss kevert saláta, pirított zsemlekocka",
  },
  {
    src: images.grillCsirkemell,
    alt: "Grill csirkemell",
    description: "Fűszeres grill csirkemell sült édesburgonyával",
  },
  {
    src: images.sztrapacska,
    alt: "Sztrapacska",
    description: "Juhtúrós sztrapacska, kapor, grill füstölt tarja, lilahagyma",
  },
  {
    src: images.sorkorcsolyak,
    alt: "Sörkorcsolyák",
    description:
      "Mozzarella rudacska, chili cheese nuggets, fekete sajtfalatok chilivel, sajtfalatok habanero chilivel (5 db), hagymakarika (6 db)",
  },
];

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
