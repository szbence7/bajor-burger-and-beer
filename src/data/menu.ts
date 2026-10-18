// Content lives in Supabase (menu_categories, menu_items); see src/server/content.ts.
import type { ImageSource } from "@/components/Picture";
import type { Beer } from "./beers";
import type { Drink } from "./drinks";

export const MENU_BADGES = ["Új", "Csípős", "Vega", "A ház kedvence"] as const;
export type MenuBadge = (typeof MENU_BADGES)[number];

export interface Burger {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  image: ImageSource;
  badges: MenuBadge[];
  featured?: boolean;
}

export interface Side {
  id: string;
  name: string;
  description: string;
  price: number;
  badges?: MenuBadge[];
}

export interface Menu {
  burgers: Burger[];
  sides: Side[];
  drinks: Drink[];
  beers: Beer[];
}
