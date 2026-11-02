import { createFileRoute, useLocation } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef } from "react";
import { Beer, FileText, Flame, Users } from "lucide-react";
import { images } from "@/data/images";
import { Picture } from "@/components/Picture";
import { Marquee } from "@/components/Marquee";
import { Doodle } from "@/components/Doodle";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { CtaLink } from "@/components/CtaButton";
import { HoursCard, MapCard } from "@/components/HoursAndMap";
import { SpecialCard } from "@/features/menu/SpecialCard";
import { MenuViewer } from "@/features/menu/MenuViewer";
import { PhotoCarousel } from "@/features/gallery/PhotoCarousel";
import { RautenDivider } from "@/components/RautenPattern";
import { cn } from "@/lib/utils";
import { ctaClass } from "@/lib/cta";
import { seo } from "@/lib/seo";
import { useSiteInfo } from "@/lib/site-info";
import { getHomeContent } from "@/features/menu/api";

// Far below the fold and the heaviest part of the page: rendered on the server as usual, but
// its code loads after first paint instead of competing with the hero.
const BookingForm = lazy(() =>
  import("@/features/booking/BookingForm").then((mod) => ({ default: mod.BookingForm })),
);

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      path: "/",
      title: "Bajor Burger & Beer — Csapolt sör, szaftos burger | Budapest",
      description:
        "Smash burgerek, saját főzésű bajor sörök és hosszú asztalok Budapest szívében. Lapozz bele az étlapba, és foglalj asztalt online a Bajor Burger & Beer-be!",
    }),
  loader: () => getHomeContent(),
  component: Index,
});

const values = [
  {
    icon: Flame,
    title: "Friss hús",
    text: "Minden reggel helyben daráljuk, soha nem fagyasztjuk.",
  },
  { icon: Beer, title: "Saját sör", text: "Négy házi főzésű sör, bajor receptek alapján." },
  { icon: Users, title: "Jó társaság", text: "Hosszú asztalok, ahol a szomszédból is barát lesz." },
];

const placePhotos = [
  { src: images.placePeople, alt: "Baráti koccintás a hosszú asztalnál" },
  { src: images.foodTable, alt: "Burgerek, perec és sör az asztalon" },
  { src: images.placeInterior, alt: "Az étterem esti belső tere" },
  { src: images.eventNight, alt: "Élőzenés est a Bajorban" },
  { src: images.placeTap, alt: "Csapolás a pultnál" },
];

/** Slight upward parallax on the hero burger; disabled for reduced motion. */
function useParallax<T extends HTMLElement>(factor: number) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (ref.current) ref.current.style.translate = `0 ${window.scrollY * factor}px`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [factor]);
  return ref;
}

/**
 * Arriving from another page at /#section, the router scrolls while the page is still
 * settling and stops short; aim again once the fonts are in and the layout is final.
 */
function useSectionScroll() {
  const hash = useLocation({ select: (l) => l.hash });
  useEffect(() => {
    if (!hash) return;
    let cancelled = false;
    void document.fonts.ready.then(() =>
      requestAnimationFrame(() => {
        if (!cancelled) document.getElementById(hash)?.scrollIntoView();
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [hash]);
}

function HeroBurger({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none", className)}>
      <div className="glow-gold absolute inset-[-12%]" />
      {/* Same sizes on both instances, so mobile and desktop share one download. */}
      <Picture
        image={images.burgerHero}
        alt=""
        loading="eager"
        fetchPriority="high"
        sizes="(min-width: 768px) 400px, 74vw"
        className="relative w-full animate-float drop-shadow-2xl"
      />
    </div>
  );
}

function Index() {
  const parallaxRef = useParallax<HTMLSpanElement>(-0.08);
  useSectionScroll();
  const { specials, month } = Route.useLoaderData();
  const { name, contact, booking, menuPdf } = useSiteInfo();

  return (
    <>
      {/* HERO — no pattern: dark base, golden glow behind the burger, global grain */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden px-5 pb-16 pt-24 md:pb-20 md:pt-28">
        <Doodle kind="mug" className="left-[3%] top-24 h-32 w-32 -rotate-12 md:h-44 md:w-44" />
        <Doodle kind="hop" className="right-[4%] top-[60%] hidden h-36 w-36 rotate-12 md:block" />

        <div className="relative mx-auto w-full max-w-7xl">
          {/* Mobile: burger sits above the stacked headline and only kisses the first line. */}
          <HeroBurger className="relative z-10 -mb-[9vw] ml-auto mr-[-4%] w-[74vw] max-w-sm md:hidden" />

          {/* md+: the burger lives in a slot right after line one, sized in em of the
              headline so it tracks the text at every width. The h1 reserves room above
              itself, so the burger never reaches the fixed header. */}
          <h1 className="relative font-impact text-[19vw] leading-[1.1] md:pt-[1.05em] md:leading-[0.94] md:text-[12vw] xl:text-[10.5rem]">
            <span className="flex items-end">
              <span className="md:whitespace-nowrap">Csapolt sör.</span>
              <span
                ref={parallaxRef}
                aria-hidden
                className="relative hidden flex-1 self-stretch md:block"
              >
                <HeroBurger className="absolute -bottom-[0.3em] left-[0.08em] z-10 w-[2.6em] xl:w-[2.2em]" />
              </span>
            </span>
            <span className="block text-primary">Szaftos burger.</span>
          </h1>
          <div className="relative z-20 mt-10 flex flex-wrap gap-4">
            <CtaLink section="foglalas">Asztalfoglalás</CtaLink>
            {menuPdf && (
              <CtaLink section="etlap" variant="outline">
                Étlap
              </CtaLink>
            )}
          </div>
        </div>
      </section>

      <Marquee />

      {/* HÓNAP AJÁNLATA — edited by the staff in the admin panel; hidden when empty */}
      {specials.length > 0 && (
        <section id="ajanlat" className="relative mx-auto max-w-7xl scroll-mt-20 px-5 py-28">
          <Doodle kind="burger" className="-left-4 top-6 h-40 w-40 md:h-56 md:w-56" />
          <Reveal>
            <SectionHeader
              eyebrow={month}
              title={
                <>
                  Hónap <span className="text-primary">ajánlata</span>
                </>
              }
            >
              A konyha e havi kedvencei. Csak korlátozott ideig, amíg a készlet tart.
            </SectionHeader>
          </Reveal>
          <div
            className={cn(
              "grid gap-8",
              specials.length === 1 && "md:mx-auto md:max-w-md",
              specials.length === 2 && "md:grid-cols-2 lg:mx-auto lg:max-w-5xl",
              specials.length >= 3 && "md:grid-cols-3",
            )}
          >
            {specials.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 120} className="h-full">
                <SpecialCard special={s} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ÉTLAP — the PDF the staff uploaded, as a page-turner; hidden until there is one */}
      {menuPdf && (
        <section id="etlap" className="relative scroll-mt-20 overflow-hidden px-5 py-28">
          <Doodle kind="fries" className="right-[4%] top-16 h-36 w-36 -rotate-6 md:h-52 md:w-52" />
          <div className="relative mx-auto max-w-7xl">
            <Reveal>
              <SectionHeader
                align="center"
                eyebrow="Étlap"
                title={
                  <>
                    Lapozz <span className="font-script text-[1.15em] text-primary">bele</span>
                  </>
                }
              >
                Burgerek, köretek, desszertek és persze a sörök. Lapozd végig, vagy nyisd meg
                nagyban.
              </SectionHeader>
            </Reveal>
            {menuPdf.pages.length > 0 ? (
              <MenuViewer pages={menuPdf.pages} />
            ) : (
              // A PDF uploaded before the pages were rendered: offer the file itself.
              <div className="text-center">
                <a href="/etlap.pdf" target="_blank" rel="noopener" className={ctaClass("gold")}>
                  <FileText className="h-4 w-4" /> Étlap megnyitása
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* RÓLUNK */}
      <section
        id="rolunk"
        className="relative mx-auto grid max-w-7xl scroll-mt-20 items-center gap-16 px-5 py-28 md:grid-cols-2"
      >
        <Doodle kind="pretzel" className="right-2 top-8 h-36 w-36 md:h-48 md:w-48" />
        <div className="relative h-[24rem] sm:h-[28rem] md:h-[34rem]">
          <div className="unveil absolute left-0 top-0 h-[70%] w-[78%] overflow-hidden rounded-3xl shadow-2xl">
            <Picture
              image={images.placeInterior}
              alt="Az étterem belső tere"
              sizes="(min-width: 1280px) 480px, (min-width: 768px) 38vw, 78vw"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="unveil absolute bottom-0 right-0 h-[62%] w-[52%] overflow-hidden rounded-3xl border-4 border-background shadow-2xl">
            <Picture
              image={images.placeTap}
              alt="Csapolás"
              sizes="(min-width: 1280px) 320px, (min-width: 768px) 26vw, 52vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <Reveal delay={150}>
          <SectionHeader
            eyebrow="Rólunk"
            title={
              <>
                Bajor szív, <span className="text-primary">pesti</span> lélek
              </>
            }
          />
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>
              A {name} egy hosszú müncheni éjszakán született: két barát, egy-egy maß, és a kérdés,
              hogy miért nincs otthon egy hely, ahol a bajor sörkultúra találkozik a jó burgerrel.
            </p>
            <p>
              Most van. Saját főzésű sörök, smash burgerek és hosszú asztalok, ahol mindenkinek jut
              hely. A cél ma is ugyanaz: őszinte étel, friss sör, hangos este.
            </p>
          </div>
        </Reveal>
      </section>

      {/* VALUES — gold */}
      <section className="relative overflow-hidden bg-primary px-5 py-24 text-primary-foreground">
        <Doodle
          kind="hop"
          className="right-[5%] top-10 h-32 w-32 rotate-12 text-primary-foreground opacity-20 md:h-44 md:w-44"
        />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionHeader tone="gold" eyebrow="Amiben hiszünk" title="Értékeink" />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100} className="h-full">
                <div className="lift h-full rounded-3xl bg-background p-8 text-foreground">
                  <v.icon className="mb-6 h-10 w-10 text-primary" />
                  <h3 className="font-display text-4xl">{v.title}</h3>
                  <p className="mt-3 text-lg text-muted-foreground">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* A HELY — a few photos to whet the appetite */}
      <section id="hely" className="relative scroll-mt-20 py-28">
        <Doodle kind="mug" className="right-[5%] top-16 h-36 w-36 rotate-6 md:h-48 md:w-48" />
        <div className="mx-auto max-w-7xl px-5">
          <Reveal>
            <SectionHeader eyebrow="Nézz be hozzánk" title="A hely" className="mb-2" />
          </Reveal>
        </div>
        <PhotoCarousel photos={placePhotos} />
      </section>

      {/* ASZTALFOGLALÁS — forest */}
      <section
        id="foglalas"
        className="relative scroll-mt-20 overflow-hidden bg-forest px-5 py-24 text-forest-foreground"
      >
        <Doodle
          kind="mug"
          className="right-[6%] top-10 h-32 w-32 text-forest-foreground opacity-20 md:h-40 md:w-40"
        />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <h2 className="mb-12 font-display text-[16vw] md:text-[8rem]">Foglalj asztalt!</h2>
          </Reveal>
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <Suspense>
              <BookingForm />
            </Suspense>
            <aside className="space-y-6 text-lg">
              <p>
                Péntek este telt ház szokott lenni, ne maradj le a hosszú asztalról. A foglalásodat
                e-mailben visszaigazoljuk.
              </p>
              <p className="rounded-3xl bg-primary p-6 font-bold text-primary-foreground">
                Az asztalt {booking.holdMinutes} percig tartjuk. Kérdésed van? Hívj minket:{" "}
                {contact.phone}
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* KAPCSOLAT */}
      <section id="kapcsolat" className="relative mx-auto max-w-7xl scroll-mt-20 px-5 py-28">
        <RautenDivider className="mb-20" />
        <Reveal>
          <SectionHeader
            eyebrow="Kapcsolat"
            title={
              <>
                Itt <span className="text-primary">találsz</span>
              </>
            }
          />
        </Reveal>
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-8">
            <Reveal>
              <HoursCard />
            </Reveal>
            {contact.socials.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {contact.socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border-2 border-primary px-5 py-2 text-sm font-extrabold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <Reveal delay={120} className="h-full">
            <MapCard />
          </Reveal>
        </div>
      </section>
    </>
  );
}
