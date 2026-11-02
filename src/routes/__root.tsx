import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import antonLatin from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";
import manropeLatin from "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url";
import oswaldLatin from "@fontsource-variable/oswald/files/oswald-latin-wght-normal.woff2?url";
import { SITE_NAME } from "@/lib/site";
import { getIndexing } from "@/lib/indexing";
import { getSiteInfoFn } from "@/lib/site-info";
import { restaurantJsonLd, toJsonLdScript } from "@/lib/structured-data";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Doodle } from "@/components/Doodle";
import { ctaClass } from "@/lib/cta";

function NotFoundComponent() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 pt-24">
      <Doodle kind="burger" className="left-[10%] top-32 h-32 w-32 -rotate-12" />
      <div className="text-center">
        <p className="font-impact text-[40vw] leading-none text-primary md:text-[18rem]">404</p>
        <h1 className="font-display text-5xl md:text-7xl">Ez a burger elfogyott</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          A keresett oldal nem létezik, vagy elköltözött. Gyere vissza a pulthoz!
        </p>
        <Link to="/" className={ctaClass("gold", "mt-8")}>
          Vissza a főoldalra
        </Link>
      </div>
    </section>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-5xl text-foreground">Hoppá, valami félrecsúszott</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Próbáld újra, vagy térj vissza a főoldalra.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className={ctaClass("gold")}
          >
            Újra
          </button>
          <a href="/" className={ctaClass("outline")}>
            Főoldal
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // NOINDEX (runtime env flag) and the site info (contact, hours, booking rules) that the
  // header, footer and JSON-LD need on every page. Refreshed at most every 5 minutes.
  loader: async () => {
    const [indexing, site] = await Promise.all([getIndexing(), getSiteInfoFn()]);
    return { ...indexing, site };
  },
  staleTime: 5 * 60_000,
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      ...(loaderData?.noindex ? [{ name: "robots", content: "noindex" }] : []),
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#121110" },
      // Defaults; each route's seo() overrides title, description and URLs.
      { title: loaderData?.site.name ?? SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: loaderData?.site.name ?? SITE_NAME },
      { property: "og:locale", content: "hu_HU" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      // Latin subsets are needed for first paint (Anton is the home LCP headline, Oswald the
      // other headlines); latin-ext (ő, ű) loads on demand through unicode-range.
      {
        rel: "preload",
        href: antonLatin,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: oswaldLatin,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: manropeLatin,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: toJsonLdScript(restaurantJsonLd(loaderData.site)),
          },
        ]
      : [],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // The admin panel has its own header and no public footer.
  const isAdmin = useRouterState({
    select: (s) => s.location.pathname === "/admin" || s.location.pathname.startsWith("/admin/"),
  });

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <Outlet />
      ) : (
        <>
          <Header />
          <main className="overflow-x-clip">
            <Outlet />
          </main>
          <Footer />
        </>
      )}
    </QueryClientProvider>
  );
}
