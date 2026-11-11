import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Picture, type ImageSource } from "@/components/Picture";
import { cn } from "@/lib/utils";

export interface CarouselPhoto {
  src: ImageSource;
  alt: string;
}

const arrowClass =
  "grid h-12 w-12 place-items-center rounded-full border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-30";

/** Horizontal carousel of tilted photo cards that straighten on hover. */
export function PhotoCarousel({ photos }: { photos: CarouselPhoto[] }) {
  const [viewportRef, embla] = useEmblaCarousel({ align: "start", loop: true });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Képek a Bajor helyszínéről és ételeiről"
    >
      {/* vertical padding keeps the hover lift and shadow from being clipped */}
      <div ref={viewportRef} className="overflow-hidden px-5 py-10">
        <div className="-ml-6 flex touch-pan-y">
          {photos.map((p, i) => (
            <div
              key={`${p.src}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${photos.length}`}
              className="min-w-0 shrink-0 grow-0 basis-[78%] pl-6 sm:basis-[45%] lg:basis-[31%] 2xl:basis-[24%]"
            >
              <figure className="overflow-hidden rounded-3xl shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-gold motion-reduce:transition-none">
                <Picture
                  image={p.src}
                  alt={p.alt}
                  sizes="(min-width: 1536px) 24vw, (min-width: 1024px) 31vw, (min-width: 640px) 45vw, 78vw"
                  className="aspect-[3/2] w-full object-cover"
                />
                <figcaption className="bg-card px-5 py-3 font-display text-xl">{p.alt}</figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5">
        <div className="hidden gap-2 sm:flex" aria-hidden>
          {photos.map((p, i) => (
            <span
              key={`${p.src}-dot-${i}`}
              className={cn(
                "h-2 rounded-full transition-all",
                i === selected ? "w-8 bg-primary" : "w-2 bg-border",
              )}
            />
          ))}
        </div>
        <p className="font-display text-xl text-muted-foreground sm:hidden">
          {selected + 1} / {photos.length}
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={prev} className={arrowClass} aria-label="Előző kép">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" onClick={next} className={arrowClass} aria-label="Következő kép">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
