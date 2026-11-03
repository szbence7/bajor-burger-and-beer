import { ArrowRight } from "lucide-react";
import type { MonthlySpecial } from "@/data/specials";
import { CtaLink } from "@/components/CtaButton";
import { Price } from "@/components/Price";
import { Picture } from "@/components/Picture";
import { cn } from "@/lib/utils";

const tones = [
  { card: "bg-primary text-primary-foreground", cta: "dark" },
  { card: "bg-forest text-forest-foreground", cta: "gold" },
  { card: "bg-card text-foreground border border-border", cta: "gold" },
] as const;

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

/** Compact colour-blocked Hónap ajánlata card; `index` cycles the gold / forest / dark tone. */
export function SpecialCard({ special, index }: { special: MonthlySpecial; index: number }) {
  const tone = tones[index % tones.length] ?? tones[0];
  return (
    <article
      className={cn(
        "group lift relative flex h-full flex-col overflow-hidden rounded-3xl p-5",
        tone.card,
      )}
    >
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
      <div className="relative -mt-2 flex h-32 flex-1 items-end justify-end">
        <Picture
          image={special.image}
          alt={special.name}
          sizes="(min-width: 640px) 14rem, 70vw"
          className="-mr-8 h-full max-h-32 w-[75%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      {special.description && (
        <p className="relative z-10 mt-3 line-clamp-3 text-sm opacity-85">{special.description}</p>
      )}
      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2">
        <Price value={special.price} className="font-display text-2xl" />
        <CtaLink section="foglalas" variant={tone.cta} className="px-4 py-2.5 text-xs">
          Foglalok <ArrowRight className="h-4 w-4" />
        </CtaLink>
      </div>
    </article>
  );
}
