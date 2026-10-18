import { createServerFn } from "@tanstack/react-start";
import { getMenu } from "@/server/content";

export const getMenuContent = createServerFn({ method: "GET" }).handler(() => getMenu());

/** Only what the home page shows: featured burgers and the house beers. */
export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => {
  const { burgers, beers } = await getMenu();
  return {
    featuredBurgers: burgers.filter((b) => b.featured),
    houseBeers: beers.filter((b) => b.house),
  };
});
