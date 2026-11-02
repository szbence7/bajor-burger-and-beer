import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Download, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { MenuPage } from "@/data/info";
import { AnimatePresence, m } from "@/components/motion";
import { ctaClass } from "@/lib/cta";
import { cn } from "@/lib/utils";

const PDF_PATH = "/etlap.pdf";
const SPREAD_QUERY = "(min-width: 1024px)";

const arrowClass =
  "grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-30";

/** Two pages side by side (an open book) on desktops, one page on phones and tablets. */
function usePagesPerView(multi: boolean) {
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    if (!multi) return;
    const query = window.matchMedia(SPREAD_QUERY);
    const update = () => setPerView(query.matches ? 2 : 1);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [multi]);
  return perView;
}

/** True once the element comes near the viewport, so page images start loading in time. */
function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setNear(true), {
      rootMargin: "800px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return [ref, near] as const;
}

/**
 * The menu PDF as a page-turner: swipe, drag, arrow keys or the buttons. The pages are images
 * the admin panel rendered at upload time; each page's text is there for screen readers.
 * "Nagyítás" opens every page full width for reading (pinch-zoom works on phones).
 */
export function MenuViewer({ pages }: { pages: MenuPage[] }) {
  const multi = pages.length > 1;
  const perView = usePagesPerView(multi);
  const [rootRef, near] = useNearViewport<HTMLDivElement>();
  const [viewportRef, embla] = useEmblaCarousel({
    align: "start",
    slidesToScroll: "auto",
    // Keep spreads paired (1–2, 3–4, …) even when the last one has a single page.
    containScroll: false,
    duration: 32,
    active: multi,
  });
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(1);
  const [reading, setReading] = useState<number | null>(null);
  const closeReading = useCallback(() => setReading(null), []);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => {
      setSelected(embla.selectedScrollSnap());
      setSnapCount(embla.scrollSnapList().length);
    };
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
    else return;
    e.preventDefault();
  };

  const first = selected * perView;
  const last = Math.min(first + perView, pages.length) - 1;
  const spread = perView === 2 && last > first;

  return (
    <div ref={rootRef}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Étlap"
        tabIndex={multi ? 0 : undefined}
        onKeyDown={multi ? onKeyDown : undefined}
        className="relative mx-auto max-w-6xl rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Warm light behind the pages, like the hero burger. */}
        <div aria-hidden className="glow-gold absolute inset-x-[10%] inset-y-[5%] opacity-40" />
        <div ref={viewportRef} className="relative overflow-hidden">
          <div
            className={cn(
              "flex touch-pan-y touch-pinch-zoom",
              multi ? "cursor-grab active:cursor-grabbing" : "justify-center",
            )}
          >
            {pages.map((page, i) => {
              const side = perView === 2 ? (i % 2 === 0 ? "left" : "right") : "single";
              const soon = near && i >= first - perView && i <= last + perView;
              return (
                <div
                  key={page.src}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1}. oldal / ${pages.length}`}
                  className={cn(
                    "flex min-w-0 shrink-0 grow-0 py-6",
                    multi ? "basis-full lg:basis-1/2" : "basis-full",
                    side === "left" && "justify-end",
                    side === "right" && "justify-start",
                    side === "single" && "justify-center px-1",
                  )}
                >
                  <img
                    src={page.src}
                    srcSet={`${page.srcSmall} 800w, ${page.src} 1600w`}
                    sizes="(min-width: 1024px) 36rem, 92vw"
                    width={page.width}
                    height={page.height}
                    alt={`Étlap, ${i + 1}. oldal`}
                    loading={soon ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    // Sized before it loads (no jump while scrolling past): as wide as the
                    // slide allows while the whole page still fits on the screen.
                    style={{
                      width: `min(100%, calc((100svh - 16rem) * ${page.width / page.height}))`,
                      aspectRatio: `${page.width} / ${page.height}`,
                    }}
                    className={cn(
                      "h-auto select-none bg-white shadow-2xl shadow-black/60",
                      side === "left"
                        ? "rounded-l-xl"
                        : side === "right"
                          ? "rounded-r-xl"
                          : "rounded-xl",
                    )}
                  />
                  <p className="sr-only">{page.text}</p>
                </div>
              );
            })}
          </div>
          {/* The spine of the open book. */}
          {spread && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-6 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/30 to-transparent"
            />
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6">
        {multi && (
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={prev}
              disabled={selected === 0}
              className={arrowClass}
              aria-label="Előző oldal"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <p className="min-w-28 text-center font-display text-2xl" aria-live="polite">
              <span className="text-primary">
                {spread ? `${first + 1}–${last + 1}` : first + 1}
              </span>
              <span className="text-muted-foreground"> / {pages.length}</span>
            </p>
            <button
              type="button"
              onClick={next}
              disabled={selected >= snapCount - 1}
              className={arrowClass}
              aria-label="Következő oldal"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        )}
        {snapCount > 1 && (
          <div className="flex gap-1">
            {Array.from({ length: snapCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => embla?.scrollTo(i)}
                aria-label={`Ugrás: ${i * perView + 1}. oldal`}
                aria-current={i === selected}
                className="grid h-6 min-w-6 place-items-center px-1"
              >
                <span
                  className={cn(
                    "block h-2 rounded-full transition-all duration-300",
                    i === selected ? "w-8 bg-primary" : "w-2 bg-border",
                  )}
                />
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setReading(first)}
            className={ctaClass("outline", "px-5 py-3")}
          >
            <Expand className="h-4 w-4" /> Nagyítás
          </button>
          <a
            href={PDF_PATH}
            download="bajor-etlap.pdf"
            className={ctaClass("outline", "px-5 py-3")}
          >
            <Download className="h-4 w-4" /> PDF letöltése
          </a>
        </div>
      </div>

      <AnimatePresence>
        {reading !== null && <ReadingView pages={pages} start={reading} onClose={closeReading} />}
      </AnimatePresence>
    </div>
  );
}

/** Every page full width, one under the other: the easiest way to read the menu on a phone. */
function ReadingView({
  pages,
  start,
  onClose,
}: {
  pages: MenuPage[];
  start: number;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus();
    scrollerRef.current
      ?.querySelector(`[data-page="${start}"]`)
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [start, onClose]);

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-label="Étlap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[90] flex flex-col bg-background/95 backdrop-blur"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <p className="font-display text-2xl">
          <span className="text-primary">Étlap</span>
          {pages.length > 1 && (
            <span className="text-muted-foreground"> · {pages.length} oldal</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <a
            href={PDF_PATH}
            download="bajor-etlap.pdf"
            className="grid h-11 w-11 place-items-center rounded-full text-foreground hover:text-primary"
            aria-label="PDF letöltése"
          >
            <Download className="h-6 w-6" />
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full text-foreground hover:text-primary"
            aria-label="Bezárás"
          >
            <X className="h-8 w-8" />
          </button>
        </div>
      </div>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-2 py-6 sm:px-5">
          {pages.map((page, i) => (
            <img
              key={page.src}
              data-page={i}
              src={page.src}
              srcSet={`${page.srcSmall} 800w, ${page.src} 1600w`}
              sizes="(min-width: 1024px) 64rem, 100vw"
              width={page.width}
              height={page.height}
              alt={`Étlap, ${i + 1}. oldal`}
              loading={Math.abs(i - start) <= 1 ? "eager" : "lazy"}
              className="h-auto w-full scroll-mt-6 rounded-lg bg-white"
            />
          ))}
        </div>
      </div>
    </m.div>
  );
}
