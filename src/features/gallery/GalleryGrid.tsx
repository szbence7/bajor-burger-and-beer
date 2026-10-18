import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { gallery, galleryCategories, type GalleryCategory } from "@/data/gallery";
import { cn } from "@/lib/utils";

/** Filterable masonry gallery with a keyboard-navigable lightbox. */
export function GalleryGrid() {
  const [filter, setFilter] = useState<GalleryCategory | "Összes">("Összes");
  const [open, setOpen] = useState<number | null>(null);
  const items = filter === "Összes" ? gallery : gallery.filter((g) => g.category === filter);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % items.length));
      if (e.key === "ArrowLeft")
        setOpen((o) => (o === null ? o : (o - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-10 flex flex-wrap gap-3">
          {(["Összes", ...galleryCategories] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-full border-2 px-5 py-2 text-sm font-extrabold uppercase tracking-widest transition-colors",
                filter === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:border-primary hover:text-primary",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {items.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setOpen(i)}
              className="group mb-6 block w-full break-inside-avoid overflow-hidden rounded-3xl border border-border bg-card"
            >
              <img
                src={g.src}
                alt={g.alt}
                loading="lazy"
                className={cn(
                  "w-full object-cover transition-transform duration-500 group-hover:scale-105",
                  g.tall ? "aspect-[3/4]" : "aspect-[4/3]",
                )}
              />
            </button>
          ))}
        </div>
      </section>

      {open !== null && items[open] && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-background/95 p-5 backdrop-blur"
          onClick={() => setOpen(null)}
        >
          <button
            className="absolute right-6 top-6 text-foreground hover:text-primary"
            aria-label="Bezárás"
          >
            <X className="h-9 w-9" />
          </button>
          <button
            className="absolute left-4 text-foreground hover:text-primary"
            aria-label="Előző"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((open - 1 + items.length) % items.length);
            }}
          >
            <ChevronLeft className="h-12 w-12" />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="max-w-5xl">
            <img
              src={items[open].src}
              alt={items[open].alt}
              className="max-h-[80vh] rounded-3xl object-contain"
            />
            <figcaption className="mt-4 text-center text-muted-foreground">
              <span className="font-bold text-primary">{items[open].category}</span> —{" "}
              {items[open].alt}
            </figcaption>
          </figure>
          <button
            className="absolute right-4 text-foreground hover:text-primary"
            aria-label="Következő"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((open + 1) % items.length);
            }}
          >
            <ChevronRight className="h-12 w-12" />
          </button>
        </div>
      )}
    </>
  );
}
