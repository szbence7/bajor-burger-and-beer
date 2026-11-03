import { createServerFn } from "@tanstack/react-start";
import { getMonthlySpecials, getTaps } from "@/server/content";

/** What the home page loads besides the site info: Hónap ajánlata, the month's name, the taps. */
export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => {
  const [specials, taps] = await Promise.all([getMonthlySpecials(), getTaps()]);
  const month = new Date().toLocaleDateString("hu-HU", {
    timeZone: "Europe/Budapest",
    month: "long",
  });
  return { specials, taps, month: month.charAt(0).toUpperCase() + month.slice(1) };
});
