import { createServerFn } from "@tanstack/react-start";
import { getMenuBooks } from "@/server/menus";
import { getMonthlySpecials } from "@/server/content";

/** Public homepage content: monthly specials and multilingual menu books. */
export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => ({
  specials: await getMonthlySpecials(),
  menus: await getMenuBooks(),
}));
