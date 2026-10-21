import { createFileRoute } from "@tanstack/react-router";
import { Beer, Flame, Users } from "lucide-react";
import { images } from "@/data/images";
import { Picture } from "@/components/Picture";
import { useSiteInfo } from "@/lib/site-info";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { Doodle } from "@/components/Doodle";
import { Marquee } from "@/components/Marquee";
import { HoursCard, MapPlaceholder } from "@/components/HoursAndMap";
import { SectionHeader } from "@/components/SectionHeader";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/rolunk")({
  head: () =>
    seo({
      path: "/rolunk",
      title: "Rólunk & Kapcsolat — Bajor Burger & Beer",
      description:
        "A Bajor Burger & Beer története, értékeink, nyitvatartásunk és elérhetőségeink. Itt találsz minket Budapesten.",
    }),
  component: AboutPage,
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

function AboutPage() {
  const { contact } = useSiteInfo();

  return (
    <>
      <PageHero
        eyebrow="Rólunk & kapcsolat"
        title={
          <>
            A mi <span className="text-primary">történetünk</span>
          </>
        }
      />

      <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-28 md:grid-cols-2">
        <Doodle kind="pretzel" className="left-[46%] top-0 h-32 w-32 md:h-44 md:w-44" />
        <Reveal>
          <Picture
            image={images.placePeople}
            alt="Vendégek koccintanak"
            sizes="(min-width: 1280px) 600px, (min-width: 768px) 48vw, 92vw"
            className="w-full rounded-3xl object-cover shadow-2xl"
          />
        </Reveal>
        <Reveal delay={150} className="space-y-5 text-lg text-muted-foreground">
          <p className="font-display text-5xl text-foreground">München → Budapest</p>
          <p>
            2019-ben két barát egy müncheni sörkertben ült, kezükben egy-egy maß, és azon
            gondolkodtak, miért nincs otthon egy hely, ahol a bajor sörkultúra találkozik a jó
            burgerrel.
          </p>
          <p>
            Egy évvel később a Kazinczy utcában megnyitottuk a Bajort: saját főzdével, smash
            burgerekkel és hosszú asztalokkal, ahol mindenkinek jut hely.
          </p>
          <p>Ma is ugyanaz a cél: őszinte étel, friss sör, hangos este.</p>
        </Reveal>
      </section>

      <section className="relative overflow-hidden bg-primary px-5 py-24 text-primary-foreground">
        <Doodle
          kind="hop"
          className="right-[5%] top-10 h-32 w-32 rotate-12 text-primary-foreground opacity-20 md:h-44 md:w-44"
        />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeader tone="gold" eyebrow="Amiben hiszünk" title="Értékeink" />
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100} className="h-full">
                <div className="lift h-full rounded-3xl bg-background p-8 text-foreground">
                  <v.icon className="mb-6 h-10 w-10 text-primary" />
                  <h3 className="font-display text-4xl">{v.title}</h3>
                  <p className="mt-3 text-muted-foreground">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Marquee
        words={["Írj nekünk", "Hívj fel", "Gyere be"]}
        tilt="right"
        variant="dark"
        className="mt-10"
      />

      <section className="relative mx-auto max-w-7xl px-5 py-28">
        <Doodle kind="mug" className="right-2 top-16 h-36 w-36 rotate-6 md:h-48 md:w-48" />
        <SectionHeader
          eyebrow="Kapcsolat"
          title={
            <>
              Itt <span className="text-primary">találsz</span>
            </>
          }
        />
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-8">
            <HoursCard />
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
          </div>
          <MapPlaceholder />
        </div>
      </section>
    </>
  );
}
