import { createServerFn } from "@tanstack/react-start";
import { getMenuBooks } from "@/server/menus";
import { getMonthlySpecials } from "@/server/content";

/** What the home page loads besides the site info: Hónap ajánlata. */
export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => ({
  specials: await getMonthlySpecials(),
  menus: await getMenuBooks(),
}));
