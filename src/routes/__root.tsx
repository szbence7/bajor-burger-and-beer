import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import antonLatin from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";
import manropeLatin from "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url";
import { SITE_NAME } from "@/lib/site";
import { restaurantJsonLd, toJsonLdScript } from "@/lib/structured-data";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Doodle } from "@/components/Doodle";
import { ctaClass } from "@/lib/cta";

function NotFoundComponent() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 pt-24">
      <Doodle kind="burger" className="left-[10%] top-32 h-32 w-32 -rotate-12" />
      <Doodle kind="mug" className="bottom-16 right-[12%] h-28 w-28 rotate-12" />
      <div className="text-center">
        <p className="font-display text-[40vw] leading-none text-primary md:text-[18rem]">404</p>
        <h1 className="font-display text-5xl md:text-7xl">Ez a burger elfogyott</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          A keresett oldal nem létezik, vagy elköltözött. Gyere vissza a pulthoz!
        </p>
        <Link to="/" className={ctaClass("ember", "mt-8")}>
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
            className={ctaClass("ember")}
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#121110" },
      // Defaults; each route's seo() overrides title, description and URLs.
      { title: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "hu_HU" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      // Latin subsets are needed for first paint (Anton is the LCP headline); latin-ext
      // (ő, ű) loads on demand through unicode-range.
      {
        rel: "preload",
        href: antonLatin,
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
    scripts: [{ type: "application/ld+json", children: toJsonLdScript(restaurantJsonLd()) }],
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

  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <main className="overflow-x-clip">
        <Outlet />
      </main>
      <Footer />
    </QueryClientProvider>
  );
}
