import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ctaClass, type CtaVariant } from "@/lib/cta";

export function CtaLink({
  to,
  children,
  variant = "ember",
  className,
}: {
  to: "/" | "/menu" | "/galeria" | "/foglalas" | "/rolunk";
  children: ReactNode;
  variant?: CtaVariant;
  className?: string;
}) {
  return (
    <Link to={to} className={ctaClass(variant, className)}>
      {children}
    </Link>
  );
}
