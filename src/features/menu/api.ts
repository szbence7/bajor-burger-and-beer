import { createServerFn } from "@tanstack/react-start";
import { getMenu, getMonthlySpecials } from "@/server/content";

export const getMenuContent = createServerFn({ method: "GET" }).handler(() => getMenu());

/** Only what the home page shows: Hónap ajánlata, the current month's name and the house beers. */
export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => {
  const [specials, { beers }] = await Promise.all([getMonthlySpecials(), getMenu()]);
  const month = new Date().toLocaleDateString("hu-HU", {
    timeZone: "Europe/Budapest",
    month: "long",
  });
  return {
    specials,
    month: month.charAt(0).toUpperCase() + month.slice(1),
    houseBeers: beers.filter((b) => b.house),
  };
});
