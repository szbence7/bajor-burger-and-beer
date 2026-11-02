// Content lives in Supabase (monthly_specials); see src/server/content.ts.
import type { ImageSource } from "@/components/Picture";

/** A "Hónap ajánlata" card on the home page. */
export interface MonthlySpecial {
  id: string;
  name: string;
  description: string;
  price: number;
  image: ImageSource;
}
