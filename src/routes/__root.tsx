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
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Doodle } from "@/components/site/Doodle";
import { ctaClass } from "@/components/site/CtaButton";

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
      { title: "Bajor Burger & Beer — Budapest" },
      { name: "description", content: "Csapolt kézműves sör és szaftos burgerek Budapesten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
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
