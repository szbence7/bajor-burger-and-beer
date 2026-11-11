import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import type { FlippingState, Orientation, PageFlip } from "page-flip";
import type { MenuPage } from "@/data/info";
import { AnimatePresence, m } from "@/components/motion";
import { ctaClass } from "@/lib/cta";
import { cn } from "@/lib/utils";

/** Below twice this width the booklet shows one page (phones), above it an open spread. */
const MIN_PAGE_WIDTH = 300;
/**
 * Room left on the screen besides a page: the fixed header and some air. The controls may
 * sit just below the fold, so the pages can be as big as possible (user request).
 */
const CHROME_HEIGHT = 150;

const arrowClass =
  "grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-30";

/** True once the element comes near the viewport, so the booklet loads in time. */
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
 * A page of the booklet, built outside React: StPageFlip moves and transforms these nodes
 * itself. In a spread, page 1 is the cover on the right, then even pages sit on the left.
 */
function pageElement(page: MenuPage, i: number): HTMLElement {
  const left = i % 2 === 1;
  const el = document.createElement("div");
  el.className = cn(
    "overflow-hidden bg-white [[data-orientation=portrait]_&]:rounded-lg",
    left ? "rounded-l-lg" : "rounded-r-lg",
  );
  const img = document.createElement("img");
  img.src = page.src;
  if (page.srcSmall !== page.src) img.srcset = `${page.srcSmall} 800w, ${page.src} 1600w`;
  img.sizes = "(min-width: 640px) 48rem, 96vw";
  img.alt = page.label ?? `Étlap, ${i + 1}. oldal`;
  if (page.language) img.lang = page.language;
  img.draggable = false;
  img.className = "pointer-events-none h-full w-full select-none object-contain";
  // The fold in the middle of an open booklet; hidden when one page is shown.
  const spine = document.createElement("div");
  spine.className = cn(
    "pointer-events-none absolute inset-y-0 w-10 from-black/25 to-transparent [[data-orientation=portrait]_&]:hidden",
    left ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r",
  );
  el.append(img, spine);
  return el;
}

/** "1", "2–3", … : the pages on screen. */
function pagesLabel(index: number, count: number, spread: boolean) {
  return spread && index > 0 && index < count - 1 ? `${index + 1}–${index + 2}` : `${index + 1}`;
}

/**
 * The menu PDF as a real booklet (StPageFlip): the pages curl as they turn, by dragging a
 * corner, swiping, clicking a page, the arrow keys or the buttons. Phones show one page,
 * wider screens an open booklet with the first page as its cover. The pages are images the
 * admin panel rendered at upload time; each page's text is there for screen readers.
 * "Nagyítás" opens every page full width for reading (pinch-zoom works on phones). No download
 * button here (user decision); /etlap.pdf stays for QR codes.
 */
export function MenuViewer({
  pages,
  title = "Étlap",
  children,
}: {
  pages: MenuPage[];
  title?: string;
  children?: ReactNode;
}) {
  const count = pages.length;
  const ratio = (pages[0]?.width ?? 1) / (pages[0]?.height ?? 1.414);
  const [rootRef, near] = useNearViewport<HTMLDivElement>();
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<PageFlip | null>(null);
  const [ready, setReady] = useState(false);
  /** The booklet's widest size (an open spread), so the cover shift is relative to it. */
  const [maxBookWidth, setMaxBookWidth] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [state, setState] = useState<FlippingState>("read");
  const [reading, setReading] = useState<number | null>(null);
  const closeReading = useCallback(() => setReading(null), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !near || count < 2) return;
    let cancelled = false;
    let book: PageFlip | null = null;
    void import("page-flip").then(({ PageFlip }) => {
      if (cancelled) return;
      // The library owns (and on destroy removes) its element, so give it its own.
      const block = document.createElement("div");
      host.append(block);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // As wide as the column allows while a whole page still fits on the screen.
      const maxWidth = Math.max(
        MIN_PAGE_WIDTH,
        Math.floor((window.innerHeight - CHROME_HEIGHT) * ratio),
      );
      setMaxBookWidth(maxWidth * 2);
      book = new PageFlip(block, {
        width: 800,
        height: Math.round(800 / ratio),
        size: "stretch",
        minWidth: MIN_PAGE_WIDTH,
        maxWidth,
        minHeight: Math.round(MIN_PAGE_WIDTH / ratio),
        maxHeight: Math.round(maxWidth / ratio),
        showCover: true,
        usePortrait: true,
        mobileScrollSupport: true,
        maxShadowOpacity: 0.45,
        flippingTime: reduced ? 350 : 900,
      });
      book.on("init", (e) => {
        setOrientation(e.data.mode);
        setIndex(e.data.page);
        setReady(true);
      });
      book.on("flip", (e) => setIndex(e.data));
      book.on("changeOrientation", (e) => setOrientation(e.data));
      book.on("changeState", (e) => setState(e.data));
      book.loadFromHTML(pages.map(pageElement));
      // Every page, the cover and the back page too, curls like a sheet of paper (user
      // request); showCover would otherwise make those two swing over like stiff card.
      for (let i = 0; i < count; i++) book.getPage(i).setDensity("soft");
      bookRef.current = book;
    });
    return () => {
      cancelled = true;
      book?.destroy();
      bookRef.current = null;
      setReady(false);
    };
  }, [near, pages, count, ratio]);

  const spread = orientation === "landscape";
  // In a spread the cover (and an even booklet's back page) is alone on one half: slide the
  // booklet so that page sits in the middle, and back as soon as it opens.
  const shift =
    spread && (state === "read" || state === "fold_corner")
      ? index === 0
        ? "-25%"
        : index === count - 1 && count % 2 === 0
          ? "25%"
          : "0%"
      : "0%";
  const atEnd = spread ? index + (index === 0 ? 1 : 2) >= count : index >= count - 1;

  const prev = useCallback(() => bookRef.current?.flipPrev(), []);
  const next = useCallback(() => bookRef.current?.flipNext(), []);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
    else return;
    e.preventDefault();
  };

  // Shown until the booklet is ready (and without JS): the cover, centred, at the size the
  // booklet will give it, so nothing jumps.
  const cover = pages[0] && (
    <div
      className="mx-auto flex aspect-[var(--page-ratio)] w-full max-w-[var(--page-max)] justify-center sm:aspect-[var(--spread-ratio)] sm:max-w-[var(--spread-max)]"
      style={
        {
          "--page-ratio": `${ratio}`,
          "--spread-ratio": `${ratio * 2}`,
          "--page-max": `calc((100svh - ${CHROME_HEIGHT}px) * ${ratio})`,
          "--spread-max": `calc((100svh - ${CHROME_HEIGHT}px) * ${ratio * 2})`,
        } as CSSProperties
      }
    >
      <img
        src={pages[0].src}
        srcSet={
          pages[0].srcSmall !== pages[0].src
            ? `${pages[0].srcSmall} 800w, ${pages[0].src} 1600w`
            : undefined
        }
        sizes="(min-width: 640px) 48rem, 96vw"
        width={pages[0].width}
        height={pages[0].height}
        alt={`${title} · ${pages[0].label ?? "1. oldal"}`}
        lang={pages[0].language}
        className="h-full w-auto rounded-lg bg-white object-contain shadow-2xl shadow-black/60"
      />
    </div>
  );

  return (
    <div ref={rootRef}>
      <div
        role="region"
        aria-roledescription={count > 1 ? "lapozható étlap" : "étlap"}
        aria-label={title}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={count > 1 ? onKeyDown : undefined}
        className="relative -mx-3 rounded-3xl py-6 outline-none sm:mx-auto sm:max-w-7xl focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Warm light behind the pages, like the hero burger. */}
        <div aria-hidden className="glow-gold absolute inset-x-[10%] inset-y-[5%] opacity-40" />
        <div className="relative">
          {!ready && cover}
          {count > 1 && (
            <div
              ref={hostRef}
              data-orientation={orientation}
              className={cn(
                "mx-auto transition-[translate,opacity] duration-700 ease-out motion-reduce:transition-none [&_.stf__item]:shadow-2xl [&_.stf__item]:shadow-black/50",
                ready ? "opacity-100" : "pointer-events-none absolute inset-x-0 top-0 opacity-0",
              )}
              style={{
                translate: `${shift} 0`,
                ...(maxBookWidth && { maxWidth: maxBookWidth }),
              }}
            />
          )}
        </div>
        {/* What the pages say, for screen readers and search engines. */}
        <div className="sr-only">
          {pages.map((page, i) => (
            <p key={page.src} lang={page.language}>
              {i + 1}. oldal: {page.text}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6">
        {children}
        {count > 1 && (
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={prev}
              disabled={!ready || index === 0}
              className={arrowClass}
              aria-label="Előző oldal"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <p className="min-w-28 text-center font-display text-2xl" aria-live="polite">
              <span className="text-primary">{pagesLabel(index, count, spread)}</span>
              <span className="text-muted-foreground"> / {count}</span>
            </p>
            <button
              type="button"
              onClick={next}
              disabled={!ready || atEnd}
              className={arrowClass}
              aria-label="Következő oldal"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setReading(index)}
            className={ctaClass("outline", "px-5 py-3")}
          >
            <Expand className="h-4 w-4" /> Nagyítás
          </button>
        </div>
      </div>

      <AnimatePresence>
        {reading !== null && (
          <ReadingView pages={pages} title={title} start={reading} onClose={closeReading} />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Every page full width, one under the other: the easiest way to read the menu on a phone. */
function ReadingView({
  pages,
  title,
  start,
  onClose,
}: {
  pages: MenuPage[];
  title: string;
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
      aria-label={title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[90] flex flex-col bg-background/95 backdrop-blur"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <p className="font-display text-2xl">
          <span className="text-primary">{title}</span>
          {pages.length > 1 && (
            <span className="text-muted-foreground"> · {pages.length} oldal</span>
          )}
        </p>
        <div className="flex items-center gap-3">
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
              srcSet={
                page.srcSmall !== page.src ? `${page.srcSmall} 800w, ${page.src} 1600w` : undefined
              }
              sizes="(min-width: 1024px) 64rem, 100vw"
              width={page.width}
              height={page.height}
              alt={`${title} · ${page.label ?? `${i + 1}. oldal`}`}
              lang={page.language}
              loading={Math.abs(i - start) <= 1 ? "eager" : "lazy"}
              className="h-auto w-full scroll-mt-6 rounded-lg bg-white"
            />
          ))}
        </div>
      </div>
    </m.div>
  );
}
