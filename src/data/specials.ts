// Content lives in Supabase (monthly_specials); see src/server/content.ts.
import type { ImageSource } from "@/components/Picture";

/** How hot a dish is: 0 = not, 1 = csípős (one chili), 2 = nagyon csípős (two chilis). */
export const SPICE_LEVELS = [0, 1, 2] as const;
export type SpiceLevel = (typeof SPICE_LEVELS)[number];
export const SPICE_LABELS: Record<SpiceLevel, string> = {
  0: "Nem csípős",
  1: "Csípős",
  2: "Nagyon csípős",
};

/** A "Hónap ajánlata" card on the home page. */
export interface MonthlySpecial {
  id: string;
  name: string;
  description: string;
  price: number;
  image: ImageSource;
  spice: SpiceLevel;
}
