import type { Burger } from "@/data/menu";
import { Picture } from "@/components/Picture";
import { Price } from "@/components/Price";
import { Tag } from "@/components/Tag";

export function MenuItemCard({ item }: { item: Burger }) {
  return (
    <article className="group lift relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6">
      <div className="relative mx-auto -mt-2 mb-4 h-52 w-full">
        <div className="glow-gold absolute inset-6 opacity-60 transition-opacity group-hover:opacity-100" />
        <Picture
          image={item.image}
          alt={item.name}
          sizes="13rem"
          className="relative h-full w-full object-contain transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105"
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {item.badges.map((b) => (
          <Tag key={b} label={b} />
        ))}
      </div>
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-4xl">{item.name}</h3>
        <Price value={item.price} className="shrink-0 font-display text-2xl text-primary" />
      </div>
      <p className="mt-3 text-muted-foreground">{item.description}</p>
      <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
        <span className="font-bold text-foreground">Összetevők: </span>
        {item.ingredients.join(", ")}
      </p>
    </article>
  );
}
