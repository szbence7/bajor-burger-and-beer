import { Link, useRouterState } from "@tanstack/react-router";
import { Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ctaClass } from "@/lib/cta";
import { BrandLogo } from "@/components/BrandLogo";
import { Collapse, Swap } from "@/components/motion";
import { useSiteInfo } from "@/lib/site-info";
import { SECTIONS, type SectionId } from "@/lib/sections";

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
