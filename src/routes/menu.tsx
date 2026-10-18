import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { burgers, sides } from "@/data/menu";
import { beers } from "@/data/beers";
import { drinks } from "@/data/drinks";
import { formatFt } from "@/data/info";
import { PageHero } from "@/components/site/PageHero";
import { MenuItemCard } from "@/components/site/MenuItemCard";
import { BeerCard } from "@/components/site/BeerCard";
import { Marquee } from "@/components/site/Marquee";
import { Reveal } from "@/components/site/Reveal";
import { Tag } from "@/components/site/Tag";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menü — Bajor Burger & Beer" },
      {
        name: "description",
        content: "Burgerek, köretek, csapolt és palackos sörök, egyéb italok árakkal.",
      },
      { property: "og:title", content: "Menü — Bajor Burger & Beer" },
      { property: "og:description", content: "Smash burgerek, bajor perec és nyolc sör a csapon." },
    ],
  }),
  component: MenuPage,
});

const tabs = [
  { id: "burgerek", label: "Burgerek" },
  { id: "koretek", label: "Köretek" },
  { id: "sorok", label: "Sörök" },
  { id: "italok", label: "Egyéb italok" },
];

function MenuPage() {
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

      <section id="burgerek" className="mx-auto max-w-7xl scroll-mt-40 px-5 py-20">
        <h2 className="mb-12 font-display text-6xl md:text-8xl">Burgerek</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {burgers.map((b, i) => (
            <Reveal key={b.id} delay={(i % 3) * 100}>
              <MenuItemCard item={b} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="koretek" className="mx-auto max-w-7xl scroll-mt-40 px-5 py-20">
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
                <span className="shrink-0 font-display text-2xl text-primary">
                  {formatFt(s.price)}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Marquee words={["Csapolt", "Palackos", "Prost"]} />

      <section id="sorok" className="mx-auto max-w-7xl scroll-mt-40 px-5 py-20">
        <h2 className="mb-12 font-display text-6xl md:text-8xl">Sörök</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {beers.map((b, i) => (
            <Reveal key={b.id} delay={(i % 4) * 80}>
              <BeerCard beer={b} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="italok" className="mx-auto max-w-4xl scroll-mt-40 px-5 py-20">
        <h2 className="mb-10 font-display text-6xl md:text-8xl">Egyéb italok</h2>
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card px-6">
          {drinks.map((d) => (
            <li key={d.id} className="flex items-baseline gap-4 py-4">
              <span className="font-bold">{d.name}</span>
              <span className="text-sm text-muted-foreground">{d.detail}</span>
              <span className="flex-1 border-b border-dashed border-border" />
              <span className="font-display text-xl text-primary">{formatFt(d.price)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
