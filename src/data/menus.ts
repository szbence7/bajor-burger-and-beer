import type { MenuPage } from "./info";
import type { MenuLanguage } from "@/lib/menu-schema";

export interface MenuBook {
  id: string;
  title: string;
  description: string;
  versions: Partial<Record<MenuLanguage, MenuPage[]>>;
}
