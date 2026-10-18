import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { timeSlots } from "@/data/info";
import { PageHero } from "@/components/site/PageHero";
import { HoursCard } from "@/components/site/HoursAndMap";
import { Doodle } from "@/components/site/Doodle";
import { ctaClass } from "@/components/site/CtaButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/foglalas")({
  head: () => ({
    meta: [
      { title: "Asztalfoglalás — Bajor Burger & Beer" },
      { name: "description", content: "Foglalj asztalt online a Bajor Burger & Beer-be." },
      { property: "og:title", content: "Asztalfoglalás — Bajor Burger & Beer" },
      { property: "og:description", content: "Válassz napot, időpontot és létszámot." },
    ],
  }),
  component: BookingPage,
});

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none [color-scheme:dark] focus:border-primary";
const labelClass = "mb-2 block font-bold";

const formatDateHu = (iso: string) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    : "";

/** Local YYYY-MM-DD; computed after mount so server and client markup match. */
function useToday() {
  const [today, setToday] = useState("");
  useEffect(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setToday(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }, []);
  return today;
}

function BookingPage() {
  const today = useToday();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    date: "",
    time: "",
    party: 2,
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const ok1 = f.date && f.time && (!today || f.date >= today);
  const ok2 = f.name && f.phone && f.email;

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
        <div className="relative rounded-3xl border border-border bg-card p-5 sm:p-8">
          {step < 3 && (
            <div className="mb-8 flex gap-3" aria-hidden>
              {[1, 2].map((s) => (
                <span
                  key={s}
                  className={cn("h-2 flex-1 rounded-full", step >= s ? "bg-primary" : "bg-muted")}
                />
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-display text-4xl sm:text-5xl">Mikor jössz?</h2>
              <div>
                <label htmlFor="booking-date" className={labelClass}>
                  Dátum
                </label>
                <input
                  id="booking-date"
                  type="date"
                  min={today}
                  className={field}
                  value={f.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <fieldset>
                <legend className={labelClass}>Időpont</legend>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                  {timeSlots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={f.time === t}
                      onClick={() => set("time", t)}
                      className={cn(
                        "rounded-2xl border-2 py-3 font-bold transition-colors",
                        f.time === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className={labelClass}>Létszám: {f.party} fő</legend>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={f.party === n}
                      aria-label={`${n} fő`}
                      onClick={() => set("party", n)}
                      className={cn(
                        "h-12 w-12 rounded-full border-2 font-bold transition-colors",
                        f.party === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button
                type="button"
                disabled={!ok1}
                onClick={() => setStep(2)}
                className={ctaClass("ember", "w-full disabled:opacity-40 sm:w-auto")}
              >
                Tovább
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-4xl sm:text-5xl">Az adataid</h2>
              <div>
                <label htmlFor="booking-name" className={labelClass}>
                  Név
                </label>
                <input
                  id="booking-name"
                  autoComplete="name"
                  className={field}
                  value={f.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="booking-phone" className={labelClass}>
                  Telefonszám
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+36 30 123 4567"
                  className={field}
                  value={f.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="booking-email" className={labelClass}>
                  E-mail
                </label>
                <input
                  id="booking-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={field}
                  value={f.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="booking-note" className={labelClass}>
                  Megjegyzés{" "}
                  <span className="font-normal text-muted-foreground">(nem kötelező)</span>
                </label>
                <textarea
                  id="booking-note"
                  className={field}
                  rows={3}
                  placeholder="pl. születésnap, babakocsi"
                  value={f.note}
                  onChange={(e) => set("note", e.target.value)}
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={() => setStep(1)} className={ctaClass("outline")}>
                  Vissza
                </button>
                <button
                  type="button"
                  disabled={!ok2}
                  onClick={() => setStep(3)}
                  className={ctaClass("ember", "disabled:opacity-40")}
                >
                  Foglalás elküldése
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="py-10 text-center" role="status">
              <span className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-10 w-10" />
              </span>
              <h2 className="break-words font-display text-4xl sm:text-6xl">
                Köszönjük, {f.name}!
              </h2>
              <p className="mt-4 text-muted-foreground">
                {formatDateHu(f.date)}, {f.time} — {f.party} fő. Visszaigazolást küldünk ide:{" "}
                <span className="break-all text-foreground">{f.email}</span>
              </p>
            </div>
          )}
        </div>
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
