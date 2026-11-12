import { createFileRoute, useLocation } from "@tanstack/react-router";
import { Suspense, lazy, useEffect } from "react";
import { images, foodPhotos } from "@/data/images";
import { Picture } from "@/components/Picture";
import { Marquee } from "@/components/Marquee";
import { Doodle, DoodleIcon, type DoodleKind } from "@/components/Doodle";
import { Ambient } from "@/components/Ambient";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { CtaLink } from "@/components/CtaButton";
import { DirectionsLinks, HoursCard, MapCard } from "@/components/HoursAndMap";
import { SpecialCard } from "@/features/menu/SpecialCard";
import { MenuCollection } from "@/features/menu/MenuCollection";
import { PhotoCarousel } from "@/features/gallery/PhotoCarousel";
import { RautenDivider, RautenPattern } from "@/components/RautenPattern";
import { seo } from "@/lib/seo";
import { useSiteInfo } from "@/lib/site-info";
import { getHomeContent } from "@/features/menu/api";
import { BookingNudge } from "@/features/booking/BookingNudge";

// Far below the fold and the heaviest part of the page: rendered on the server as usual, but
// its code loads after first paint instead of competing with the hero.
const BookingForm = lazy(() =>
  import("@/features/booking/BookingForm").then((mod) => ({ default: mod.BookingForm })),
);

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      path: "/",
      title: "Bajor Burger & Beer — Smash burger és csapolt sör | Budapest",
      description:
        "Bajor sörház és burgerező Budapesten: smash burgerek, csapolt világos, búza és IPA, hosszú esték. Lapozz bele az étlapba, és foglalj asztalt online!",
    }),
  loader: () => getHomeContent(),
  component: Index,
});

const values: { icon: DoodleKind; title: string; text: string }[] = [
  {
    icon: "burger",
    title: "Lapítva sütjük",
    text: "A húsgolyót forró platnin nyomjuk laposra: kívül ropogós kérget kap, belül szaftos marad.",
  },
  {
    icon: "mug",
    title: "Csapról, hidegen",
    text: "Világos, búza, IPA. Hogy ma melyik folyik, azt a pultnál elárulják.",
  },
  {
    icon: "burger",
    title: "Nincs hova sietni",
    text: "Jó sörök, finom falatok, laza tempó. Térj be egy beszélgetésre a barátokkal.",
  },
];

const placePhotos = [
  { src: images.placeInterior, alt: "A Bajor pultja és asztalai" },
  ...foodPhotos,
];

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

function Index() {
  useSectionScroll();
  const { specials, menus } = Route.useLoaderData();
  const { name, contact, booking } = useSiteInfo();

  return (
    <>
      {/* Editorial photo composition, retaining the site's gold, cream and diamonds. */}
      <section className="home-hero relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_65%)]"
        >
          <RautenPattern className="opacity-[0.06]" />
        </div>

        <div className="home-hero-inner relative mx-auto w-full max-w-7xl">
          <div className="home-hero-copy relative z-10">
            <h1 className="home-hero-title font-impact">
              <span className="block">Prost,</span>
              <span className="block text-primary">Budapest!</span>
            </h1>
            <p className="mt-7 max-w-md text-lg text-muted-foreground md:text-xl">
              Hideg sör csapról, smash burger forrón. Beugrasz egy korsóra, aztán itt ragadsz egész
              estére.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <CtaLink section="foglalas">Asztalfoglalás</CtaLink>
              {menus.length > 0 && (
                <CtaLink section="etlap" variant="outline">
                  Étlap
                </CtaLink>
              )}
            </div>
          </div>

          <figure className="home-hero-photo">
            <div className="home-hero-photo-frame">
              <Picture
                image={images.burgerHeroPhoto}
                alt="Bajor burger pirított hagymás buciban, olvadt sajttal és baconnel, palalapon tálalva"
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1280px) 900px, (min-width: 768px) 70vw, 100vw"
                className="home-hero-image"
              />
            </div>
            <figcaption className="home-hero-caption">
              <span className="font-script text-primary">Jó helyen jársz.</span>
              <span className="home-hero-caption-rule" aria-hidden />
              <span className="home-hero-caption-label">Burger. Sör. Bajor.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <Marquee />

      {/* HÓNAP AJÁNLATA — edited by the staff in the admin panel; hidden when empty */}
      {specials.length > 0 && (
        <section
          id="ajanlat"
          className="relative isolate mx-auto max-w-7xl scroll-mt-20 px-5 pb-12 pt-20 md:pb-16 md:pt-24"
        >
          <Ambient side="left" />

          <SectionHeader title="Hónap ajánlata" />

          {/* Compact cards: 1 / 2 / 3 / 4 / 5 per row by width; a part-filled last row (or a
              single special) sits centred. */}
          <div className="flex flex-wrap justify-center gap-5">
            {specials.map((s, i) => (
              <Reveal
                key={s.id}
                delay={(i % 5) * 80}
                className="w-full max-w-sm sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)] xl:w-[calc((100%-5rem)/5)]"
              >
                <SpecialCard special={s} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Menus managed in the admin panel. */}
      {menus.length > 0 && (
        <section
          id="etlap"
          className="relative scroll-mt-20 overflow-hidden px-5 pb-24 pt-12 md:pb-28 md:pt-16"
        >
          {/* Bavarian diamonds fading in from the top left (mirrors the hero's top right). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_60%)]"
          >
            <RautenPattern className="opacity-[0.09]" />
          </div>
          <Doodle kind="fries" className="right-[4%] top-16 h-36 w-36 -rotate-6 md:h-52 md:w-52" />
          <div className="relative mx-auto max-w-7xl">
            <SectionHeader
              align="center"
              title={
                <>
                  Lapozz <span className="font-script text-[1.15em] text-primary">bele</span>
                </>
              }
            >
              Válassz étlapot, és lapozz bele! Fogd meg a lap sarkát, használd a nyilakat, vagy
              nyisd meg nagyban.
            </SectionHeader>

            <MenuCollection books={menus} />
          </div>
        </section>
      )}

      {/* Full-bleed photo band: a pause between the menu and the story. Fades into the dark
          background at both ends. */}
      <div id="sav" className="relative h-[55svh] max-h-[44rem] min-h-80 overflow-hidden">
        <Picture
          image={images.sorkorcsolyak}
          alt="Sörkorcsolyák és egy pohár sör a Bajorban"
          sizes="100vw"
          className="h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-background via-transparent to-background"
        />
      </div>

      {/* RÓLUNK */}
      <section
        id="rolunk"
        className="relative isolate mx-auto grid max-w-7xl scroll-mt-20 items-center gap-16 px-5 pb-20 pt-24 md:grid-cols-2 md:pb-24 md:pt-28"
      >
        <Ambient side="right" />
        <div className="relative h-[24rem] sm:h-[28rem] md:h-[34rem]">
          <div className="unveil absolute left-0 top-0 h-[70%] w-[78%] overflow-hidden rounded-3xl shadow-2xl">
            <Picture
              image={images.placeInterior}
              alt="A Bajor pultja és asztalai"
              sizes="(min-width: 1280px) 480px, (min-width: 768px) 38vw, 78vw"
              // The food photo covers the right of this one: keep the "BAJOR BEER" lettering in view.
              className="h-full w-full object-cover object-[20%_60%]"
            />
          </div>
          <div className="unveil absolute bottom-0 right-0 h-[62%] w-[52%] overflow-hidden rounded-3xl border-4 border-background shadow-2xl">
            <Picture
              image={images.brutalSmashed}
              alt="A Bajor Brutal Smashed burgere sajttal és baconnel"
              sizes="(min-width: 1280px) 320px, (min-width: 768px) 26vw, 52vw"
              className="absolute left-1/2 top-1/2 h-[140%] w-auto max-w-none -translate-x-[35%] -translate-y-[63.5%]"
            />
          </div>
        </div>

        <div>
          <SectionHeader title="Sörház, komoly burgerrel" />
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>A {name} jó sörökkel, szaftos hamburgerekkel és finom falatokkal vár.</p>
            <p>
              Ugorj be egy ebédre vagy vacsorára, és koccints egyet a barátokkal. Nézz bele az
              étlapba, és térj be hozzánk!
            </p>
          </div>
        </div>
      </section>

      {/* VALUES — gold */}
      {/* VALUES — concrete like the bar counter, asymmetric: the heading holds the left column, the three points
          stack as rows on the right. */}
      <section className="bg-concrete-texture relative overflow-hidden px-5 py-20 text-concrete-foreground md:py-24">
        <Doodle
          kind="hop"
          className="bottom-10 left-[5%] hidden h-40 w-40 rotate-12 text-concrete-foreground opacity-20 lg:block"
        />
        <div className="relative mx-auto grid max-w-7xl items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <SectionHeader tone="concrete" title="Így megy ez nálunk" className="lg:mb-0" />
          <div className="grid gap-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100}>
                <div className="lift flex items-start gap-5 rounded-3xl bg-background p-6 text-foreground sm:gap-6 sm:p-8">
                  <DoodleIcon kind={v.icon} className="mt-1 h-12 w-12 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-display text-3xl sm:text-4xl">{v.title}</h3>
                    <p className="mt-2 text-lg text-muted-foreground">{v.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* A HELY — a few photos to whet the appetite */}
      <section id="hely" className="relative isolate scroll-mt-20 pb-16 pt-20 md:pb-20 md:pt-24">
        <Ambient side="left" />
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeader title="A hely és az ételek" className="mb-2" />
        </div>
        <PhotoCarousel photos={placePhotos} />
      </section>

      {/* ASZTALFOGLALÁS — forest */}
      <section
        id="booking-section"
        className="relative scroll-mt-20 overflow-hidden bg-forest px-5 py-24 text-forest-foreground"
      >
        <div className="relative mx-auto max-w-7xl">
          <h2 className="mb-12 font-display text-[16vw] md:text-[8rem]">Foglalj asztalt!</h2>

          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <Suspense>
              <BookingForm />
            </Suspense>
            <aside className="space-y-6 text-lg">
              <p>
                Ha biztosra mennél, foglalj asztalt előre. A foglalást e-mailben visszaigazoljuk.
              </p>
              <p className="bg-concrete-texture rounded-3xl p-6 font-bold text-concrete-foreground">
                Az asztalt {booking.holdMinutes} percig tartjuk. Kérdésed van? Hívj minket:{" "}
                {contact.phone}
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* KAPCSOLAT */}
      <section
        id="kapcsolat"
        className="relative mx-auto max-w-7xl scroll-mt-20 px-5 pb-20 pt-14 md:pb-24 md:pt-16"
      >
        <RautenDivider className="mb-14" />

        <SectionHeader title="Itt találsz" />

        {/* Hours | map side by side at the same height; directions under the map. The social
            links live in the footer. */}
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div className="md:col-start-1 md:row-start-1">
            <HoursCard />
          </div>
          <div className="h-full md:col-start-2 md:row-start-1">
            <MapCard className="h-full" />
          </div>
          <div className="md:col-start-2 md:row-start-2">
            <DirectionsLinks />
          </div>
        </div>
      </section>
      <BookingNudge />
    </>
  );
}
