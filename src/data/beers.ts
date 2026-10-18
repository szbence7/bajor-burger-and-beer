// Content lives in Supabase (beers); see src/server/content.ts.
import type { ImageSource } from "@/components/Picture";

export type BeerServe = "csapolt" | "palackos";

export interface BeerSize {
  label: string; // pl. "0,3 l"
  price: number;
}

export interface Beer {
  id: string;
  name: string;
  style: string;
  brewery: string;
  abv: number;
  serve: BeerServe;
  sizes: BeerSize[];
  house?: boolean;
  image?: ImageSource;
}
