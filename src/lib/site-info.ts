import { createServerFn } from "@tanstack/react-start";
import { getRouteApi } from "@tanstack/react-router";
import { getSiteInfo } from "@/server/content";

/** Contact details, opening hours and booking rules; loaded once by the root route. */
export const getSiteInfoFn = createServerFn({ method: "GET" }).handler(() => getSiteInfo());

const rootRoute = getRouteApi("__root__");

/** Site info from the root loader, for components rendered inside the root layout. */
export const useSiteInfo = () => rootRoute.useLoaderData({ select: (d) => d.site });
