import { SPICE_LABELS, type MonthlySpecial } from "@/data/specials";
import { Price } from "@/components/Price";
import { Picture } from "@/components/Picture";
import { SpiceIcon } from "@/features/menu/SpiceIcon";

/**
 * Compact Hónap ajánlata card. One calm tone for every card (the colour carries no meaning, so
 * it no longer cycles); the gold lives in the price and the hover glow.
 */
export function SpecialCard({ special }: { special: MonthlySpecial }) {
  return (
    <article className="group lift relative flex h-full flex-col overflow-hidden rounded-3xl border border-concrete/25 bg-card p-5 text-foreground">
      {/* The dish name in the brush script of the printed menus. It stays above the image
          layer so every word is always readable. */}
      <h3
        lang="hu"
        // Every name at one size (user request: as big as "Chili Surf & Turf"). No automatic
        // hyphenation: with balanced lines it split words that fit ("Salvato-re"); only a word
        // wider than the card breaks.
        className="relative z-10 text-balance break-words font-script text-4xl"
      >
        {/* How hot: one or two chilis in the top right corner. Floated, so only the first
            line of the name makes room for them. */}
        <SpiceIcon level={special.spice} decorative className="float-right ml-1 mt-1 h-8" />
        {special.name}
        {special.spice > 0 && <span className="sr-only"> ({SPICE_LABELS[special.spice]})</span>}
      </h3>
      {special.image && (
        <div className="relative mt-4 overflow-hidden rounded-xl">
          <Picture
            image={special.image}
            alt={special.name}
            sizes="(min-width: 640px) 14rem, 70vw"
            className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        </div>
      )}
      {special.description && (
        <p className="relative z-10 mt-3 line-clamp-3 text-sm opacity-85">{special.description}</p>
      )}
      <p className="relative z-10 mt-auto pt-4">
        <Price value={special.price} className="font-display text-2xl text-primary" />
      </p>
    </article>
  );
}
