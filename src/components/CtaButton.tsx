import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ctaClass, type CtaVariant } from "@/lib/cta";
import type { SectionId } from "@/lib/sections";

/** A CTA that scrolls to a section of the home page (from any page). */
export function CtaLink({
  section,
  children,
  variant = "gold",
  className,
}: {
  section: SectionId;
  children: ReactNode;
  variant?: CtaVariant;
  className?: string;
}) {
  return (
    <Link to="/" hash={section} className={ctaClass(variant, className)}>
      {children}
    </Link>
  );
}
