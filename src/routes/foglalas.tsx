import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { timeSlots } from "@/data/info";
import { PageHero } from "@/components/site/PageHero";
import { HoursCard } from "@/components/site/HoursAndMap";
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

const field = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary";

function BookingPage() {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ date: "", time: "", party: 2, name: "", phone: "", email: "", note: "" });
  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const ok1 = f.date && f.time;
  const ok2 = f.name && f.phone && f.email;

  return (
    <>
      <PageHero eyebrow="Foglalás" title={<>Asztal<span className="text-primary">foglalás</span></>} />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-28 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-8">
          {step < 3 && (
            <div className="mb-8 flex gap-3">
              {[1, 2].map((s) => (
                <span key={s} className={cn("h-2 flex-1 rounded-full", step >= s ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-display text-5xl">Mikor jössz?</h2>
              <input type="date" className={field} value={f.date} onChange={(e) => set("date", e.target.value)} />
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {timeSlots.map((t) => (
                  <button key={t} onClick={() => set("time", t)} className={cn("rounded-2xl border-2 py-3 font-bold", f.time === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}>{t}</button>
                ))}
              </div>
              <div>
                <p className="mb-3 font-bold">Létszám: {f.party} fő</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <button key={n} onClick={() => set("party", n)} className={cn("h-12 w-12 rounded-full border-2 font-bold", f.party === n ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{n}</button>
                  ))}
                </div>
              </div>
              <button disabled={!ok1} onClick={() => setStep(2)} className={ctaClass("ember", "disabled:opacity-40")}>Tovább</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-5xl">Az adataid</h2>
              <input className={field} placeholder="Név" value={f.name} onChange={(e) => set("name", e.target.value)} />
              <input className={field} placeholder="Telefonszám" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
              <input className={field} type="email" placeholder="E-mail" value={f.email} onChange={(e) => set("email", e.target.value)} />
              <textarea className={field} rows={3} placeholder="Megjegyzés (pl. születésnap)" value={f.note} onChange={(e) => set("note", e.target.value)} />
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className={ctaClass("outline")}>Vissza</button>
                <button disabled={!ok2} onClick={() => setStep(3)} className={ctaClass("ember", "disabled:opacity-40")}>Foglalás elküldése</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="py-10 text-center">
              <span className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-10 w-10" /></span>
              <h2 className="font-display text-6xl">Köszönjük, {f.name}!</h2>
              <p className="mt-4 text-muted-foreground">{f.date}, {f.time} — {f.party} fő. Visszaigazolást küldünk ide: {f.email}.</p>
            </div>
          )}
        </div>
        <aside className="space-y-6">
          <HoursCard />
          <p className="rounded-3xl bg-primary p-6 font-bold text-primary-foreground">8 fő felett hívj minket telefonon. Az asztalt 15 percig tartjuk.</p>
        </aside>
      </section>
    </>
  );
}
