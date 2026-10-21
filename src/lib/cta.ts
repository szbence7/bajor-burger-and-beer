import { cn } from "@/lib/utils";

export const ctaVariants = {
  gold: "bg-primary text-primary-foreground hover:-translate-y-1 hover:bg-primary-glow shadow-gold",
  outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  dark: "bg-background text-primary hover:-translate-y-1",
};

export type CtaVariant = keyof typeof ctaVariants;

export const ctaClass = (variant: CtaVariant = "gold", className?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-widest transition-all duration-300",
    ctaVariants[variant],
    className,
  );
