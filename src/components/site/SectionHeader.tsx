import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  children,
  align = "left",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "gold";
  className?: string;
}) {
  return (
    <div className={cn("mb-12", align === "center" && "mx-auto max-w-3xl text-center", className)}>
      {eyebrow && (
        <p className={cn("mb-4 text-sm font-bold uppercase tracking-[0.3em]", tone === "gold" ? "text-primary-foreground/70" : "text-primary")}>
          {eyebrow}
        </p>
      )}
      <h2 className={cn("font-display text-6xl md:text-8xl", tone === "gold" ? "text-primary-foreground" : "text-foreground")}>{title}</h2>
      {children && (
        <p className={cn("mt-5 max-w-xl text-lg", align === "center" && "mx-auto", tone === "gold" ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {children}
        </p>
      )}
    </div>
  );
}
