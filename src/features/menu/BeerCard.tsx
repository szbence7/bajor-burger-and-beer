import { Beer as BeerIcon } from "lucide-react";
import type { Beer } from "@/data/beers";
import { cn } from "@/lib/utils";
import { Price } from "@/components/Price";
import { Tag } from "@/components/Tag";

export function BeerCard({ beer, tone = "dark" }: { beer: Beer; tone?: "dark" | "onGold" }) {
  const onGold = tone === "onGold";
  return (
    <article
      className={cn(
        "lift relative flex h-full flex-col rounded-3xl p-6",
        onGold ? "bg-background text-foreground" : "border border-border bg-card",
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <BeerIcon className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <Tag label={beer.serve} />
      </div>
      <h3 className="font-display text-4xl">{beer.name}</h3>
      <p className="mt-2 text-base font-extrabold uppercase tracking-wider text-primary">
        {beer.style}
      </p>
      <p className="mb-6 mt-1 text-base text-foreground/80">{beer.brewery}</p>
      <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-5">
        <span className="font-display text-5xl leading-none">
          {beer.abv.toLocaleString("hu-HU")}
          <span className="text-2xl text-foreground/80">%</span>
        </span>
        <dl className="space-y-1 text-right">
          {beer.sizes.map((s) => (
            <div key={s.label} className="flex items-baseline justify-end gap-3">
              <dt className="text-base text-foreground/80">{s.label}</dt>
              <dd className="font-display text-2xl leading-tight text-primary">
                <Price value={s.price} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
