import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { HoursCard } from "@/components/HoursAndMap";
import { Doodle } from "@/components/Doodle";
import { BookingForm } from "@/features/booking/BookingForm";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/foglalas")({
  head: () =>
    seo({
      path: "/foglalas",
      title: "Asztalfoglalás — Bajor Burger & Beer",
      description:
        "Foglalj asztalt online pár kattintással: válassz napot, időpontot és létszámot, mi pedig visszaigazoljuk a foglalásodat.",
    }),
  component: BookingPage,
});

function BookingPage() {
  return (
    <>
      <PageHero
        eyebrow="Foglalás"
        title={
          <>
            Asztal
            <wbr />
            <span className="text-primary">foglalás</span>
          </>
        }
      />
      <section className="relative mx-auto grid max-w-7xl gap-8 px-5 pb-28 lg:grid-cols-[1.6fr_1fr]">
        <Doodle kind="mug" className="-left-6 bottom-10 hidden h-48 w-48 -rotate-6 lg:block" />
        <BookingForm />
        <aside className="space-y-6">
          <HoursCard />
          <p className="rounded-3xl bg-primary p-6 font-bold text-primary-foreground">
            8 fő felett hívj minket telefonon. Az asztalt 15 percig tartjuk.
          </p>
        </aside>
      </section>
    </>
  );
}
