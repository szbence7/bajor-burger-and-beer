import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { galleryCategories, type GalleryCategory, type GalleryItem } from "@/data/gallery";
import { cn } from "@/lib/utils";
import { Picture } from "@/components/Picture";
import { AnimatePresence, m } from "@/components/motion";
import { useSmoothList } from "@/lib/motion";

/** Filterable masonry gallery with a keyboard-navigable lightbox. */
export function GalleryGrid({ items: gallery }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<GalleryCategory | "Összes">("Összes");
  const [open, setOpen] = useState<number | null>(null);
  const items = filter === "Összes" ? gallery : gallery.filter((g) => g.category === filter);
  // Filtering slides the photos into their new places instead of jumping.
  const gridRef = useSmoothList<HTMLDivElement>();

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
              aria-pressed={filter === c}
              className={cn(
                "relative isolate rounded-full border-2 px-5 py-2 text-sm font-extrabold uppercase tracking-widest transition-colors",
                filter === c
                  ? "border-primary text-primary-foreground"
                  : "border-border text-foreground hover:border-primary hover:text-primary",
              )}
            >
              {filter === c && (
                <m.span
                  layoutId="gallery-filter"
                  className="absolute -inset-0.5 -z-10 rounded-full bg-primary"
                />
              )}
              {c}
            </button>
          ))}
        </div>
        <div ref={gridRef} className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {items.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setOpen(i)}
              className="unveil group mb-6 block w-full break-inside-avoid overflow-hidden rounded-3xl border border-border bg-card"
            >
              <Picture
                image={g.src}
                alt={g.alt}
                sizes="(min-width: 1280px) 400px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 92vw"
                className={cn(
                  "w-full object-cover transition-transform duration-500 group-hover:scale-105",
                  g.tall ? "aspect-[3/4]" : "aspect-[4/3]",
                )}
              />
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {open !== null && items[open] && (
          <m.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
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
            <AnimatePresence mode="wait" initial={false}>
              <m.figure
                key={open}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-5xl"
              >
                <Picture
                  image={items[open].src}
                  alt={items[open].alt}
                  loading="eager"
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="max-h-[80vh] w-auto rounded-3xl object-contain"
                />
                <figcaption className="mt-4 text-center text-muted-foreground">
                  <span className="font-bold text-primary">{items[open].category}</span> —{" "}
                  {items[open].alt}
                </figcaption>
              </m.figure>
            </AnimatePresence>
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
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
