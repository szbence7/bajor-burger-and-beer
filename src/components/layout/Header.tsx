import { Link } from "@tanstack/react-router";
import { Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ctaClass } from "@/lib/cta";
import { BrandLogo } from "@/components/BrandLogo";

const nav = [
  { to: "/", label: "Főoldal" },
  { to: "/menu", label: "Menü" },
  { to: "/galeria", label: "Galéria" },
  { to: "/rolunk", label: "Rólunk & Kapcsolat" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          aria-label="Bajor Burger & Beer – Főoldal"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <BrandLogo alt="" className="h-12 md:h-14" />
          <span className="font-display text-3xl leading-none text-primary md:text-4xl">Bajor</span>
        </Link>
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="text-sm font-bold uppercase tracking-widest text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {n.label}
            </Link>
          ))}
          <Link to="/foglalas" className={ctaClass("gold", "px-5 py-3")}>
            Asztalfoglalás
          </Link>
        </nav>
        <button
          className="text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menü megnyitása"
        >
          {open ? <X className="h-8 w-8" /> : <MenuIcon className="h-8 w-8" />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-2 px-5 pb-8 lg:hidden">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="font-display text-5xl text-foreground hover:text-primary"
            >
              {n.label}
            </Link>
          ))}
          <Link to="/foglalas" onClick={() => setOpen(false)} className={ctaClass("gold", "mt-4")}>
            Asztalfoglalás
          </Link>
        </nav>
      )}
    </header>
  );
}
