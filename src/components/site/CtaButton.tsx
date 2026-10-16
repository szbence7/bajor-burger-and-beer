import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  ember: "bg-ember text-ember-foreground shadow-ember hover:-translate-y-1 hover:brightness-110",
  gold: "bg-primary text-primary-foreground hover:-translate-y-1 hover:bg-primary-glow shadow-gold",
  outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  dark: "bg-background text-primary hover:-translate-y-1",
};

export const ctaClass = (variant: keyof typeof variants = "ember", className?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-widest transition-all duration-300",
    variants[variant],
    className,
  );

export function CtaLink({
  to,
  children,
  variant = "ember",
  className,
}: {
  to: "/" | "/menu" | "/galeria" | "/foglalas" | "/rolunk";
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <Link to={to} className={ctaClass(variant, className)}>
      {children}
    </Link>
  );
}
