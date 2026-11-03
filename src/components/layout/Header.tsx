import { Link, useRouterState } from "@tanstack/react-router";
import { Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ctaClass } from "@/lib/cta";
import { BrandLogo } from "@/components/BrandLogo";
import { Collapse, Swap } from "@/components/motion";
import { useSiteInfo } from "@/lib/site-info";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { openStatus } from "@/lib/opening-hours";

/** The section in the middle of the screen, for highlighting its nav link. */
function useActiveSection(ids: readonly SectionId[], enabled: boolean) {
  const [active, setActive] = useState<SectionId | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    setActive(null);
    if (!enabled) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id as SectionId;
          setActive((current) => (e.isIntersecting ? id : current === id ? null : current));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of key.split(",")) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [key, enabled]);
  return active;
}

/**
 * "Nyitva 23:00-ig" / "Zárva · nyitás: holnap 12:00", from the admin-set opening hours in
 * Budapest time. Rendered on the server too, so it never pops in. After hydration the badge
 * remounts once with the browser's clock (hydration keeps the server's text, and a re-render
 * with the same text would never patch it), then re-checks every minute.
 */
function OpenBadge({ className }: { className?: string }) {
  const { openingHours } = useSiteInfo();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  if (openingHours.length === 0) return null;
  const status = openStatus(openingHours, now ?? new Date());
  return (
    <Link
      key={now ? "live" : "server"}
      to="/"
      hash="kapcsolat"
      className={cn(
        // Too tight beside the logo on the narrowest phones.
        "hidden items-center gap-2 whitespace-nowrap text-sm font-bold text-foreground/80 transition-colors hover:text-primary min-[360px]:flex",
        className,
      )}
    >
      <span
        aria-hidden
        suppressHydrationWarning
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          status.open ? "bg-primary shadow-gold" : "bg-muted-foreground/60",
        )}
      />
      <span suppressHydrationWarning>{status.open ? `Nyitva ${status.until}-ig` : "Zárva"}</span>
      {/* Always rendered (only its text changes), so server and browser HTML match. */}
      <span suppressHydrationWarning className="hidden font-normal text-muted-foreground sm:inline">
        {!status.open && status.next ? `· nyitás: ${status.next.day} ${status.next.time}` : ""}
      </span>
    </Link>
  );
}

export function Header() {
  const { name, menuPdf } = useSiteInfo();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Close the mobile menu on any navigation, not only via its own links.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav: SectionId[] = menuPdf
    ? ["etlap", "rolunk", "hely", "kapcsolat"]
    : ["rolunk", "hely", "kapcsolat"];
  const active = useActiveSection(nav, pathname === "/");

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-border bg-background/95 backdrop-blur"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
        <Link
          to="/"
          aria-label={`${name} – Főoldal`}
          className="flex items-center gap-3"
          onClick={() => {
            setOpen(false);
            // Already home: back to the top.
            if (pathname === "/") window.scrollTo({ top: 0 });
          }}
        >
          <BrandLogo alt="" className="h-12 md:h-14" />
          <span className="font-display text-3xl leading-none text-primary md:text-4xl">Bajor</span>
        </Link>
        <OpenBadge className="ml-auto mr-5 lg:mr-8" />
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((id) => (
            <Link
              key={id}
              to="/"
              hash={id}
              className={cn(
                "text-sm font-bold uppercase tracking-widest transition-colors hover:text-primary",
                active === id ? "text-primary" : "text-foreground/80",
              )}
            >
              {SECTIONS[id]}
            </Link>
          ))}
          <Link to="/" hash="foglalas" className={ctaClass("gold", "px-5 py-3")}>
            Asztalfoglalás
          </Link>
        </nav>
        <button
          className="text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
          aria-expanded={open}
        >
          <Swap id={open ? "close" : "open"}>
            {open ? <X className="h-8 w-8" /> : <MenuIcon className="h-8 w-8" />}
          </Swap>
        </button>
      </div>
      <Collapse open={open} className="lg:hidden">
        <nav className="flex flex-col gap-2 px-5 pb-8">
          {nav.map((id) => (
            <Link
              key={id}
              to="/"
              hash={id}
              onClick={() => setOpen(false)}
              className="font-display text-5xl text-foreground hover:text-primary"
            >
              {SECTIONS[id]}
            </Link>
          ))}
          <Link
            to="/"
            hash="foglalas"
            onClick={() => setOpen(false)}
            className={ctaClass("gold", "mt-4")}
          >
            Asztalfoglalás
          </Link>
        </nav>
      </Collapse>
    </header>
  );
}
