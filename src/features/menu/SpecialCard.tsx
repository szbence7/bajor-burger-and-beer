import type { MonthlySpecial } from "@/data/specials";
import { Price } from "@/components/Price";
import { Picture } from "@/components/Picture";
import { cn } from "@/lib/utils";

/**
 * The staff type the names in the admin panel, so the title steps down for long words
 * instead of overflowing the card.
 */
function titleSize(name: string) {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length));
  if (longest <= 6) return "text-4xl";
  if (longest <= 8) return "text-[1.75rem]";
  return "text-[1.5rem]";
}

/**
 * Compact Hónap ajánlata card. One calm tone for every card (the colour carries no meaning, so
 * it no longer cycles); the gold lives in the price and the hover glow. The burger hangs over
 * the card's right edge for a bit of depth (user request), so the card does not clip.
 */
export function SpecialCard({ special }: { special: MonthlySpecial }) {
  return (
    <article className="group lift relative flex h-full flex-col rounded-3xl border border-border bg-card p-5 text-foreground">
      {/* The dish name in the brush script of the printed menus. It stays above the image
          layer so every word is always readable. */}
      <h3
        lang="hu"
        className={cn(
          "relative z-10 hyphens-auto text-balance break-words font-script",
          titleSize(special.name),
        )}
      >
        {special.name}
      </h3>
      <div className="relative z-10 -mt-2 flex h-32 flex-1 items-end justify-end">
        <Picture
          image={special.image}
          alt={special.name}
          sizes="(min-width: 640px) 14rem, 70vw"
          className="-mr-9 h-full max-h-36 w-[80%] object-contain object-right drop-shadow-2xl sm:-mr-12 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      {special.description && (
        <p className="relative z-10 mt-3 line-clamp-3 text-sm opacity-85">{special.description}</p>
      )}
      <p className="relative z-10 mt-4">
        <Price value={special.price} className="font-display text-2xl text-primary" />
      </p>
    </article>
  );
}
