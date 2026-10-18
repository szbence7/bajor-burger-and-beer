import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { MenuItemCard } from "@/features/menu/MenuItemCard";
import { BeerCard } from "@/features/menu/BeerCard";
import { Marquee } from "@/components/Marquee";
import { Reveal } from "@/components/Reveal";
import { Tag } from "@/components/Tag";
import { Price } from "@/components/Price";
import { Doodle } from "@/components/Doodle";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";
import { getMenuContent } from "@/features/menu/api";

export const Route = createFileRoute("/menu")({
  head: () =>
    seo({
      path: "/menu",
      title: "Menü — Burgerek, köretek és sörök | Bajor Burger & Beer",
      description:
        "Smash burgerek, óriás bajor perec, köretek, négy házi főzésű csapolt sör és válogatott kézműves sörök: a teljes étlap és itallap árakkal.",
    }),
  loader: () => getMenuContent(),
  component: MenuPage,
});

const tabs = [
  { id: "burgerek", label: "Burgerek" },
  { id: "koretek", label: "Köretek" },
  { id: "sorok", label: "Sörök" },
  { id: "italok", label: "Egyéb italok" },
];

function MenuPage() {
  const { burgers, sides, drinks, beers } = Route.useLoaderData();
  const [active, setActive] = useState("burgerek");
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    tabs.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Étlap & itallap"
        title={
          <>
            A <span className="text-primary">menü</span>
          </>
        }
      >
        Minden burger mellé kérhetsz köretet — és persze egy korsót.
      </PageHero>

      <div className="sticky top-20 z-40 border-y border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none]">
          {tabs.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={cn(
                "shrink-0 rounded-full px-5 py-2 text-sm font-extrabold uppercase tracking-widest transition-colors",
                active === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              {t.label}
            </a>
          ))}
        </div>
      </div>

      <section id="burgerek" className="relative mx-auto max-w-7xl scroll-mt-40 px-5 py-20">
        <Doodle kind="burger" className="right-0 top-10 h-40 w-40 rotate-6 md:h-56 md:w-56" />
        <h2 className="mb-12 font-display text-6xl md:text-8xl">Burgerek</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {burgers.map((b, i) => (
            <Reveal key={b.id} delay={(i % 3) * 100}>
              <MenuItemCard item={b} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="koretek" className="relative mx-auto max-w-7xl scroll-mt-40 px-5 py-20">
        <Doodle kind="fries" className="right-4 top-8 h-36 w-36 -rotate-6 md:h-48 md:w-48" />
        <h2 className="mb-12 font-display text-6xl md:text-8xl">Köretek</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {sides.map((s) => (
            <Reveal key={s.id}>
              <div className="lift flex items-start justify-between gap-6 rounded-3xl border border-border bg-card p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-3xl">{s.name}</h3>
                    {s.badges?.map((b) => (
                      <Tag key={b} label={b} />
                    ))}
                  </div>
                  <p className="mt-2 text-muted-foreground">{s.description}</p>
                </div>
                <Price value={s.price} className="shrink-0 font-display text-2xl text-primary" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Marquee words={["Csapolt", "Palackos", "Prost"]} />

      <section id="sorok" className="relative mx-auto max-w-7xl scroll-mt-40 px-5 py-20">
        <Doodle kind="hop" className="right-2 top-8 h-36 w-36 rotate-12 md:h-48 md:w-48" />
        <h2 className="mb-12 font-display text-6xl md:text-8xl">Sörök</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {beers.map((b, i) => (
            <Reveal key={b.id} delay={(i % 4) * 80} className="h-full">
              <BeerCard beer={b} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="italok" className="relative mx-auto max-w-4xl scroll-mt-40 px-5 py-20">
        <Doodle kind="mug" className="-right-10 top-6 h-36 w-36 -rotate-6 md:h-48 md:w-48" />
        <h2 className="mb-10 font-display text-6xl md:text-8xl">Egyéb italok</h2>
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card px-6">
          {drinks.map((d) => (
            <li key={d.id} className="flex items-baseline gap-4 py-4">
              <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-3">
                <span className="font-bold">{d.name}</span>
                <span className="text-sm text-muted-foreground">{d.detail}</span>
              </span>
              <span className="min-w-4 flex-1 border-b border-dashed border-border" />
              <Price value={d.price} className="shrink-0 font-display text-xl text-primary" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
