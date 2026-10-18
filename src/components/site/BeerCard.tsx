import { Beer as BeerIcon } from "lucide-react";
import type { Beer } from "@/data/beers";
import { formatFt } from "@/data/info";
import { cn } from "@/lib/utils";
import { Tag } from "./Tag";

export function BeerCard({ beer, tone = "dark" }: { beer: Beer; tone?: "dark" | "onGold" }) {
  const onGold = tone === "onGold";
  return (
    <article
      className={cn(
        "lift relative flex flex-col rounded-3xl p-6",
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
      <p className="mt-1 text-sm font-bold uppercase tracking-widest text-primary">{beer.style}</p>
      <p className="mt-1 text-sm text-muted-foreground">{beer.brewery}</p>
      <div className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-4">
        <span className="font-display text-3xl">
          {beer.abv.toLocaleString("hu-HU")}
          <span className="text-lg text-muted-foreground">%</span>
        </span>
        <div className="space-y-1 text-right text-sm">
          {beer.sizes.map((s) => (
            <div key={s.label}>
              <span className="text-muted-foreground">{s.label}</span>{" "}
              <span className="font-bold">{formatFt(s.price)}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
