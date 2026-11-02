import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { images } from "@/data/images";
import { Picture } from "@/components/Picture";
import { Marquee } from "@/components/Marquee";
import { Doodle } from "@/components/Doodle";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { BeerCard } from "@/features/menu/BeerCard";
import { CtaLink } from "@/components/CtaButton";
import { HoursCard, MapPlaceholder } from "@/components/HoursAndMap";
import { SpecialCard } from "@/features/menu/SpecialCard";
import { PhotoCarousel } from "@/features/gallery/PhotoCarousel";
import { RautenDivider } from "@/components/RautenPattern";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";
import { getHomeContent } from "@/features/menu/api";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      path: "/",
      title: "Bajor Burger & Beer — Csapolt sör, szaftos burger | Budapest",
      description:
        "Smash burgerek, saját főzésű bajor sörök és hosszú asztalok Budapest szívében. Nézd meg a menüt, és foglalj asztalt online a Bajor Burger & Beer-be!",
    }),
  loader: () => getHomeContent(),
  component: Index,
});

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
  const { specials, month, houseBeers } = Route.useLoaderData();

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
            <CtaLink to="/foglalas">Asztalfoglalás</CtaLink>
            <CtaLink to="/menu" variant="outline">
              Menü
            </CtaLink>
          </div>
        </div>
      </section>

      <Marquee />

      {/* HÓNAP AJÁNLATA — edited by the staff in the admin panel; hidden when empty */}
      {specials.length > 0 && (
        <section id="honap-ajanlata" className="relative mx-auto max-w-7xl px-5 py-28">
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

      {/* HOUSE BEERS — gold */}
      <section className="relative overflow-hidden bg-primary px-5 py-28 text-primary-foreground">
        <Doodle
          kind="foam"
          className="right-[6%] top-12 h-32 w-32 text-primary-foreground opacity-20 md:h-44 md:w-44"
        />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionHeader tone="gold" eyebrow="Saját főzésű" title="A ház sörei">
              Négy csapon, a saját főzdénkből. Bajor hagyomány, budapesti lendület.
            </SectionHeader>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {houseBeers.map((b, i) => (
              <Reveal key={b.id} delay={i * 100} className="h-full">
                <BeerCard beer={b} tone="onGold" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-32 md:grid-cols-2">
        <Doodle kind="pretzel" className="right-2 top-8 h-36 w-36 md:h-48 md:w-48" />
        <Reveal className="relative h-[24rem] sm:h-[28rem] md:h-[34rem]">
          <Picture
            image={images.placeInterior}
            alt="Az étterem belső tere"
            sizes="(min-width: 1280px) 480px, (min-width: 768px) 38vw, 78vw"
            className="absolute left-0 top-0 h-[70%] w-[78%] rounded-3xl object-cover shadow-2xl"
          />
          <Picture
            image={images.placeTap}
            alt="Csapolás"
            sizes="(min-width: 1280px) 320px, (min-width: 768px) 26vw, 52vw"
            className="absolute bottom-0 right-0 h-[62%] w-[52%] rounded-3xl border-4 border-background object-cover shadow-2xl"
          />
        </Reveal>
        <Reveal delay={150}>
          <SectionHeader
            eyebrow="Rólunk"
            title={
              <>
                Bajor szív, <span className="text-primary">pesti</span> lélek
              </>
            }
          />
          <p className="text-lg text-muted-foreground">
            A Bajor Burger &amp; Beer egy hosszú müncheni éjszakán született: sör, perec, és a
            kérdés, hogy miért nincs ilyen hely otthon. Most van. Hosszú asztalok, hangos nevetés,
            és a legjobb burger, amit sör mellé ehetsz.
          </p>
          <CtaLink to="/rolunk" variant="outline" className="mt-8">
            A történetünk <ArrowRight className="h-4 w-4" />
          </CtaLink>
        </Reveal>
      </section>

      {/* PLACE CAROUSEL */}
      <section className="relative py-28">
        <Doodle kind="hop" className="right-[5%] top-16 h-36 w-36 rotate-12 md:h-48 md:w-48" />
        <div className="mx-auto max-w-7xl px-5">
          <Reveal>
            <SectionHeader eyebrow="Galéria" title="A hely" className="mb-2" />
          </Reveal>
        </div>
        <PhotoCarousel photos={placePhotos} />
        <div className="mt-10 text-center">
          <CtaLink to="/galeria" variant="outline">
            Teljes galéria
          </CtaLink>
        </div>
      </section>

      <RautenDivider className="mx-auto mb-20 max-w-7xl" />

      {/* HOURS + MAP */}
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-28 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <HoursCard />
        </Reveal>
        <Reveal delay={120} className="h-full">
          <MapPlaceholder />
        </Reveal>
      </section>

      {/* BOOKING CTA */}
      <section className="relative overflow-hidden bg-forest px-5 py-24 text-forest-foreground">
        <Doodle
          kind="mug"
          className="bottom-8 right-[6%] h-32 w-32 text-forest-foreground opacity-20 md:h-40 md:w-40"
        />
        <div className="relative mx-auto max-w-7xl text-center">
          <h2 className="font-display text-[16vw] md:text-[10rem]">Foglalj asztalt!</h2>
          <p className="mx-auto mt-4 max-w-lg text-lg">
            Péntek este telt ház szokott lenni. Ne maradj le a hosszú asztalról.
          </p>
          <CtaLink to="/foglalas" className="mt-10">
            Asztalfoglalás <ArrowRight className="h-4 w-4" />
          </CtaLink>
        </div>
      </section>
    </>
  );
}
