import { ArrowRight } from "lucide-react";
import type { Burger } from "@/data/menu";
import { CtaLink } from "@/components/CtaButton";
import { Price } from "@/components/Price";
import { cn } from "@/lib/utils";

const tones = [
  { card: "bg-primary text-primary-foreground", cta: "dark" },
  { card: "bg-ember text-ember-foreground", cta: "dark" },
  { card: "bg-card text-foreground border border-border", cta: "gold" },
] as const;

/** Big colour-blocked homepage card; `index` cycles the gold / ember / dark tone. */
export function FeaturedBurgerCard({ burger, index }: { burger: Burger; index: number }) {
  const tone = tones[index % tones.length] ?? tones[0];
  return (
    <article
      className={cn(
        "group lift relative flex h-full min-h-[30rem] flex-col overflow-hidden rounded-3xl p-7 md:min-h-[28rem] lg:min-h-[34rem]",
        tone.card,
      )}
    >
      {/* Title stays above the image layer so both words are always readable. */}
      <h3 className="relative z-10 font-display text-7xl md:text-5xl lg:text-7xl xl:text-8xl">
        {burger.name.split(" ").map((w) => (
          <span key={w} className="block">
            {w}
          </span>
        ))}
      </h3>
      <div className="relative -mt-6 flex flex-1 items-end justify-end">
        <img
          src={burger.image}
          alt={burger.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="-mr-12 w-[82%] max-w-[22rem] drop-shadow-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
        <Price value={burger.price} className="font-display text-3xl" />
        <CtaLink to="/menu" variant={tone.cta} className="px-5 py-3">
          Megnézem <ArrowRight className="h-4 w-4" />
        </CtaLink>
      </div>
    </article>
  );
}
