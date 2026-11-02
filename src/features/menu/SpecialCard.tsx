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
  if (longest <= 9) return "text-6xl md:text-5xl lg:text-6xl xl:text-7xl";
  if (longest <= 12) return "text-5xl md:text-4xl lg:text-5xl xl:text-6xl";
  return "text-4xl md:text-3xl lg:text-4xl xl:text-5xl";
}

/** Big colour-blocked Hónap ajánlata card; `index` cycles the gold / forest / dark tone. */
export function SpecialCard({ special, index }: { special: MonthlySpecial; index: number }) {
  const tone = tones[index % tones.length] ?? tones[0];
  return (
    <article
      className={cn(
        "group lift relative flex h-full min-h-[30rem] flex-col overflow-hidden rounded-3xl p-7 md:min-h-[28rem] lg:min-h-[34rem]",
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
      <div className="relative -mt-6 flex min-h-40 flex-1 items-end justify-end">
        <Picture
          image={special.image}
          alt={special.name}
          sizes="(min-width: 768px) 22rem, 82vw"
          className="-mr-12 max-h-72 w-[82%] max-w-[22rem] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      {special.description && (
        <p className="relative z-10 mt-4 line-clamp-3 text-base opacity-85">
          {special.description}
        </p>
      )}
      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
        <Price value={special.price} className="font-display text-3xl" />
        <CtaLink section="foglalas" variant={tone.cta} className="px-5 py-3">
          Foglalok <ArrowRight className="h-4 w-4" />
        </CtaLink>
      </div>
    </article>
  );
}
