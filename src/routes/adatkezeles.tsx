import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageHero } from "@/components/PageHero";
import { Doodle } from "@/components/Doodle";
import { seo } from "@/lib/seo";
import { useSiteInfo } from "@/lib/site-info";

// PLACEHOLDER: the final privacy notice text comes from the client. The facts below match
// what the site actually does (booking data, consent timestamp, 12-month deletion).
export const Route = createFileRoute("/adatkezeles")({
  head: () =>
    seo({
      path: "/adatkezeles",
      title: "Adatkezelési tájékoztató — Bajor Burger & Beer",
      description:
        "Milyen adatokat kérünk asztalfoglaláskor, mire használjuk és meddig őrizzük őket, és milyen jogaid vannak: a Bajor Burger & Beer adatkezelési tájékoztatója.",
    }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-3xl text-primary md:text-4xl">{title}</h2>
      {children}
    </section>
  );
}

function PrivacyPage() {
  const { name, company, contact } = useSiteInfo();

  return (
    <>
      <PageHero
        eyebrow="Adatvédelem"
        title={
          <>
            Adat
            <wbr />
            <span className="text-primary">kezelés</span>
          </>
        }
      >
        Röviden és érthetően arról, mit kezdünk az adataiddal, amikor asztalt foglalsz.
      </PageHero>

      <section className="relative mx-auto max-w-4xl px-5 pb-28">
        <Doodle kind="pretzel" className="-right-10 top-10 hidden h-40 w-40 rotate-12 md:block" />
        <p className="mb-8 rounded-3xl bg-primary p-6 font-bold text-primary-foreground">
          Ideiglenes szöveg: a végleges adatkezelési tájékoztató hamarosan felkerül.
        </p>
        <div className="space-y-10 rounded-3xl border border-border bg-card p-6 text-muted-foreground sm:p-10">
          <Section title="Ki kezeli az adataidat?">
            <p>
              {company.name || name}
              {company.address ? ` (székhely: ${company.address}` : ` (${contact.address}`}
              {company.regNumber && `, cégjegyzékszám: ${company.regNumber}`}
              {company.taxNumber && `, adószám: ${company.taxNumber}`}), a(z) {name} üzemeltetője.
              Elérhetőségeink: {contact.email}, {contact.phone}.
            </p>
          </Section>
          <Section title="Milyen adatokat kérünk?">
            <p>
              Asztalfoglaláskor a nevedet, telefonszámodat, e-mail-címedet, a foglalás dátumát,
              időpontját és létszámát, valamint az általad megadott megjegyzést. Rögzítjük azt is,
              mikor fogadtad el ezt a tájékoztatót.
            </p>
          </Section>
          <Section title="Mire használjuk?">
            <p>
              Kizárólag a foglalásod kezelésére: hogy tartsuk neked az asztalt, és szükség esetén
              felvegyük veled a kapcsolatot. Az adataidat nem adjuk el, és nem küldünk hírlevelet.
            </p>
          </Section>
          <Section title="Milyen jogalapon?">
            <p>A hozzájárulásod alapján, amelyet a foglalás elküldésekor adsz meg.</p>
          </Section>
          <Section title="Meddig őrizzük?">
            <p>A foglalás dátumától számított 12 hónapig, utána a rendszer automatikusan törli.</p>
          </Section>
          <Section title="Térkép">
            <p>
              A Kapcsolat részben a Google Maps térképe jelenik meg. Amikor betöltődik, a böngésződ
              kapcsolatba lép a Google szervereivel, és a Google sütiket helyezhet el. Erre a Google
              adatvédelmi szabályai vonatkoznak. A „Vigyél oda” gombok a Google Maps, az Apple
              Térképek vagy a Waze oldalát nyitják meg.
            </p>
          </Section>
          <Section title="Milyen jogaid vannak?">
            <p>
              Kérheted az adataidhoz való hozzáférést, a helyesbítésüket vagy törlésüket, a
              kezelésük korlátozását, és visszavonhatod a hozzájárulásodat. Ehhez írj nekünk a{" "}
              {contact.email} címre. Panasszal a Nemzeti Adatvédelmi és Információszabadság
              Hatósághoz (NAIH) is fordulhatsz.
            </p>
          </Section>
        </div>
      </section>
    </>
  );
}
