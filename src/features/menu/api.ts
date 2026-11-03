import { createServerFn } from "@tanstack/react-start";
import { getMonthlySpecials } from "@/server/content";

/** What the home page loads besides the site info: Hónap ajánlata and the month's name. */
export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => {
  const specials = await getMonthlySpecials();
  const month = new Date().toLocaleDateString("hu-HU", {
    timeZone: "Europe/Budapest",
    month: "long",
  });
  return { specials, month: month.charAt(0).toUpperCase() + month.slice(1) };
});
