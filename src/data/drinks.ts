// Content lives in Supabase (menu_items in a "drink" category); see src/server/content.ts.
export interface Drink {
  id: string;
  name: string;
  detail: string;
  price: number;
}
