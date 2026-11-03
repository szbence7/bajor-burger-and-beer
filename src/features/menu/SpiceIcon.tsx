import { SPICE_LABELS, type SpiceLevel } from "@/data/specials";
import { cn } from "@/lib/utils";

/**
 * The red chili of the restaurant's printed menu: one for csípős, two for nagyon csípős.
 * Nothing for a dish that isn't hot. The SVGs live in public/icons (their red is the menu's,
 * outside the site palette on purpose).
 */
export function SpiceIcon({
  level,
  className,
  decorative = false,
}: {
  level: SpiceLevel;
  className?: string;
  /** Next to a text that already says it (e.g. a "Csípős" button): hidden from screen readers. */
  decorative?: boolean;
}) {
  if (level === 0) return null;
  return (
    <img
      src={level === 2 ? "/icons/chili-2.svg" : "/icons/chili.svg"}
      alt={decorative ? "" : SPICE_LABELS[level]}
      {...(!decorative && { title: SPICE_LABELS[level] })}
      width={level === 2 ? 80 : 64}
      height={level === 2 ? 72 : 64}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
