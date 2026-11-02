import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Pages cross-fade instead of jumping (View Transitions API; see styles.css).
    defaultViewTransition: true,
    defaultPreloadStaleTime: 0,
    // Content changes rarely; don't refetch it on every client-side navigation.
    defaultStaleTime: 60_000,
  });

  return router;
};
