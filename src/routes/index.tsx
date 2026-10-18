import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { images } from "@/data/images";
import { burgers } from "@/data/menu";
import { beers } from "@/data/beers";
import { formatFt } from "@/data/info";
import { Marquee } from "@/components/site/Marquee";
import { Doodle } from "@/components/site/Doodle";
import { Reveal } from "@/components/site/Reveal";
import { RotatingBadge } from "@/components/site/RotatingBadge";
import { SectionHeader } from "@/components/site/SectionHeader";
import { BeerCard } from "@/components/site/BeerCard";
import { CtaLink } from "@/components/site/CtaButton";
import { HoursCard, MapPlaceholder } from "@/components/site/HoursAndMap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bajor Burger & Beer — Csapolt sör, szaftos burger | Budapest" },
      {
        name: "description",
        content:
          "Kézműves csapolt sörök és smash burgerek Budapest szívében. Foglalj asztalt a Bajor Burger & Beer-be!",
      },
      { property: "og:title", content: "Bajor Burger & Beer — Budapest" },
      { property: "og:description", content: "Csapolt sör. Szaftos burger. Jó társaság." },
    ],
  }),
  component: Index,
});

const cardTones = [
  "bg-primary text-primary-foreground",
  "bg-ember text-ember-foreground",
  "bg-card text-foreground border border-border",
];

function Index() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const f = () => setY(window.scrollY);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const featured = burgers.filter((b) => b.featured);
  const houseBeers = beers.filter((b) => b.house);

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-5 pb-20 pt-32">
        <div className="rauten pointer-events-none absolute inset-0 text-primary opacity-[0.035]" />
        <Doodle kind="mug" className="left-[4%] top-28 h-24 w-24 -rotate-12" />
        <Doodle kind="pretzel" className="bottom-24 left-[8%] h-20 w-20" />
        <Doodle kind="hop" className="right-[6%] top-36 h-20 w-20 rotate-12" />
        <Doodle kind="fries" className="bottom-20 right-[30%] h-20 w-20 -rotate-6" />

        <div className="relative mx-auto w-full max-w-7xl">
          <h1 className="relative z-0 font-display text-[19vw] md:text-[13vw] xl:text-[11.5rem]">
            <span className="block">Csapolt sör.</span>
            <span className="block text-primary">Szaftos burger.</span>
          </h1>
          <div
            className="pointer-events-none absolute right-[-6%] top-1/2 z-10 w-[70vw] max-w-[640px] -translate-y-1/2 md:right-[-2%] md:w-[46vw]"
            style={{ transform: `translateY(calc(-50% + ${y * 0.15}px))` }}
          >
            <div className="glow-gold absolute inset-[-10%]" />
            <img
              src={images.burgerHero}
              alt="Bajor Dupla burger"
              width={1024}
              height={1024}
              className="relative animate-float drop-shadow-2xl"
            />
          </div>
          <div className="relative z-20 mt-10 flex flex-wrap gap-4">
            <CtaLink to="/foglalas">Asztalfoglalás</CtaLink>
            <CtaLink to="/menu" variant="outline">
              Menü
            </CtaLink>
          </div>
          <RotatingBadge className="absolute -top-10 right-0 z-20 hidden md:grid" />
        </div>
      </section>

      <Marquee />

      {/* FEATURED BURGERS */}
      <section className="relative mx-auto max-w-7xl px-5 py-28">
        <Doodle kind="burger" className="-left-2 top-10 h-28 w-28" />
        <Reveal>
          <SectionHeader
            eyebrow="A konyhából"
            title={
              <>
                Kedvenc <span className="text-primary">burgereink</span>
              </>
            }
          >
            Friss, napi darálású marha, házi szószok és puha buci. Ennyi a titok.
          </SectionHeader>
        </Reveal>
        <div className="grid gap-8 md:grid-cols-3">
          {featured.map((b, i) => (
            <Reveal key={b.id} delay={i * 120}>
              <article
                className={cn(
                  "group lift relative flex h-full min-h-[34rem] flex-col overflow-hidden rounded-3xl p-7",
                  cardTones[i % 3],
                )}
              >
                <h3 className="font-display text-7xl opacity-95 lg:text-8xl">
                  {b.name.split(" ").map((w) => (
                    <span key={w} className="block">
                      {w}
                    </span>
                  ))}
                </h3>
                <img
                  src={b.image}
                  alt={b.name}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="absolute -right-10 bottom-20 w-[85%] drop-shadow-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                />
                <div className="relative mt-auto flex items-center justify-between">
                  <span className="font-display text-3xl">{formatFt(b.price)}</span>
                  <CtaLink to="/menu" variant={i === 2 ? "gold" : "dark"} className="px-5 py-3">
                    Megnézem <ArrowRight className="h-4 w-4" />
                  </CtaLink>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOUSE BEERS — gold */}
      <section className="relative overflow-hidden bg-primary px-5 py-28 text-primary-foreground">
        <div className="rauten pointer-events-none absolute inset-0 text-primary-foreground opacity-[0.06]" />
        <Doodle
          kind="foam"
          className="right-[6%] top-12 h-28 w-28 text-primary-foreground opacity-30"
        />
        <Doodle
          kind="hop"
          className="bottom-10 left-[4%] h-24 w-24 text-primary-foreground opacity-30"
        />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <SectionHeader tone="gold" eyebrow="Saját főzésű" title="A ház sörei">
              Négy csapon, a saját főzdénkből. Bajor hagyomány, budapesti lendület.
            </SectionHeader>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {houseBeers.map((b, i) => (
              <Reveal key={b.id} delay={i * 100}>
                <BeerCard beer={b} tone="onGold" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-32 md:grid-cols-2">
        <Doodle kind="pretzel" className="right-4 top-10 h-24 w-24" />
        <Doodle kind="mug" className="bottom-6 left-[40%] h-24 w-24 opacity-20" />
        <Reveal className="relative h-[28rem] md:h-[34rem]">
          <img
            src={images.placeInterior}
            alt="Az étterem belső tere"
            loading="lazy"
            className="absolute left-0 top-0 h-[70%] w-[78%] -rotate-3 rounded-3xl object-cover shadow-2xl"
          />
          <img
            src={images.placeTap}
            alt="Csapolás"
            loading="lazy"
            className="absolute bottom-0 right-0 h-[62%] w-[52%] rotate-3 rounded-3xl border-4 border-background object-cover shadow-2xl"
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

      <Marquee words={["Prost", "Egészségedre", "Hétvégén élőzene"]} tilt="right" variant="dark" />

      {/* PLACE STRIP */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal>
            <SectionHeader eyebrow="Galéria" title="A hely" />
          </Reveal>
        </div>
        <div className="flex snap-x gap-6 overflow-x-auto px-5 pb-8 pt-4 [scrollbar-width:none]">
          {[
            images.placePeople,
            images.foodTable,
            images.placeInterior,
            images.eventNight,
            images.placeTap,
          ].map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Hangulatkép a Bajorból"
              loading="lazy"
              className={cn(
                "h-96 w-72 shrink-0 snap-center rounded-3xl object-cover shadow-xl transition-transform duration-500 hover:rotate-0 hover:scale-105 md:w-80",
                i % 2 === 0 ? "-rotate-2" : "rotate-2",
              )}
            />
          ))}
        </div>
        <div className="mt-4 text-center">
          <CtaLink to="/galeria" variant="outline">
            Teljes galéria
          </CtaLink>
        </div>
      </section>

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
      <section className="relative overflow-hidden bg-ember px-5 py-24 text-ember-foreground">
        <Doodle
          kind="burger"
          className="left-[5%] top-10 h-28 w-28 text-ember-foreground opacity-30"
        />
        <Doodle
          kind="mug"
          className="bottom-8 right-[6%] h-28 w-28 text-ember-foreground opacity-30"
        />
        <div className="relative mx-auto max-w-7xl text-center">
          <h2 className="font-display text-[16vw] md:text-[10rem]">Foglalj asztalt!</h2>
          <p className="mx-auto mt-4 max-w-lg text-lg opacity-90">
            Péntek este telt ház szokott lenni. Ne maradj le a hosszú asztalról.
          </p>
          <CtaLink to="/foglalas" variant="dark" className="mt-10">
            Asztalfoglalás <ArrowRight className="h-4 w-4" />
          </CtaLink>
        </div>
      </section>
    </>
  );
}
