import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { openingHourRow, siteSettingsRow } from "@/lib/site-rows";
import { WEEKDAY_LABELS, toDayHours, type DayHours } from "@/lib/opening-hours";
import { cn } from "@/lib/utils";
import { saveSiteDetailsFn } from "./api";
import { ADMIN_ERRORS, SOCIAL_NETWORKS, siteDetailsInput, type SiteDetailsInput } from "./schema";
import { adminSupabase } from "./supabase";
import { Collapse, Swap } from "@/components/motion";
import { Button, Card, PageTitle, inputClass, labelClass, useToast } from "./ui";

const QUERY_KEY = ["admin", "site-details"];

const BOOKING_FIELDS = [
  ["capacity", "Férőhely (egyszerre ennyi vendég)", "fő"],
  ["maxPartySize", "Online foglalható legnagyobb létszám", "fő"],
  ["durationMinutes", "Egy foglalás időtartama", "perc"],
  ["slotMinutes", "Időpontok közti lépés", "perc"],
  ["daysAhead", "Ennyi nappal előre lehet foglalni", "nap"],
  ["minNoticeMinutes", "Legalább ennyivel előtte kell foglalni", "perc"],
  ["holdMinutes", "Ennyi ideig tartjuk az asztalt késés esetén", "perc"],
] as const;
type BookingField = (typeof BOOKING_FIELDS)[number][0];

interface FormState {
  restaurantName: string;
  phone: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  companyName: string;
  companyAddress: string;
  taxNumber: string;
  regNumber: string;
  socials: Record<(typeof SOCIAL_NETWORKS)[number], string>;
  hours: DayHours[];
  booking: Record<BookingField, string>;
}

function useSiteDetails() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<FormState> => {
      const db = adminSupabase();
      const [settings, hours] = await Promise.all([
        db.from("site_settings").select("*").single(),
        db.from("opening_hours").select("label, days, opens, closes").order("sort_order"),
      ]);
      if (settings.error) throw settings.error;
      if (hours.error) throw hours.error;
      const s = siteSettingsRow.parse(settings.data);
      const href = (label: string) => s.socials.find((x) => x.label === label)?.href ?? "";
      return {
        restaurantName: s.restaurant_name,
        phone: s.phone,
        email: s.email,
        street: s.street,
        postalCode: s.postal_code,
        city: s.city,
        companyName: s.company_name,
        companyAddress: s.company_address,
        taxNumber: s.tax_number,
        regNumber: s.company_reg_number,
        socials: {
          Instagram: href("Instagram"),
          Facebook: href("Facebook"),
          TikTok: href("TikTok"),
        },
        hours: toDayHours(z.array(openingHourRow).parse(hours.data)),
        booking: {
          capacity: String(s.booking_capacity),
          maxPartySize: String(s.booking_max_party_size),
          durationMinutes: String(s.booking_duration_minutes),
          slotMinutes: String(s.booking_slot_minutes),
          daysAhead: String(s.booking_days_ahead),
          minNoticeMinutes: String(s.booking_min_notice_minutes),
          holdMinutes: String(s.booking_hold_minutes),
        },
      };
    },
  });
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="font-display text-2xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  className,
  ...input
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error: string | undefined;
  className?: string;
  type?: string;
  inputMode?: "numeric" | "email" | "tel" | "url";
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        className={inputClass}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        {...input}
      />
      <Collapse open={Boolean(error)}>
        <p id={`${id}-error`} className="pt-2 text-sm font-bold text-primary-glow">
          {error}
        </p>
      </Collapse>
    </div>
  );
}

function Form({ initial }: { initial: FormState }) {
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const queryClient = useQueryClient();
  useEffect(() => setF(initial), [initial]);

  const save = useMutation({
    mutationFn: (data: SiteDetailsInput) => saveSiteDetailsFn({ data }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast(ADMIN_ERRORS[result.error], "warning");
        return;
      }
      toast("Mentve. A weboldalon már az új adatok látszanak.");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => toast(ADMIN_ERRORS.unknown, "warning"),
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));
  const err = (path: string) => errors[path];
  const text = (k: Exclude<keyof FormState, "socials" | "hours" | "booking">) => ({
    id: `site-${k}`,
    value: f[k],
    onChange: (v: string) => set(k, v),
    error: err(k),
  });
  const setDay = (i: number, patch: Partial<DayHours>) =>
    set(
      "hours",
      f.hours.map((d, j) => (j === i ? { ...d, ...patch } : d)),
    );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const num = (v: string) => (v.trim() === "" ? Number.NaN : Number(v));
    const parsed = siteDetailsInput.safeParse({
      ...f,
      booking: Object.fromEntries(Object.entries(f.booking).map(([k, v]) => [k, num(v)])) as Record<
        BookingField,
        number
      >,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      toast("Néhány mező hibás, nézd át a pirossal jelölteket.", "warning");
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`site-${first}`)?.focus();
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Section
        title="Étterem"
        hint="A fejlécben, a láblécben, a Kapcsolat oldalon, az e-mailekben és a Google-nek szóló adatokban jelenik meg."
      >
        <Field label="Étterem neve" className="sm:col-span-2" {...text("restaurantName")} />
        <Field
          label="Telefonszám"
          type="tel"
          inputMode="tel"
          placeholder="+36 1 234 5678"
          {...text("phone")}
        />
        <Field label="E-mail-cím" type="email" inputMode="email" {...text("email")} />
        <Field label="Utca, házszám" className="sm:col-span-2" {...text("street")} />
        <Field label="Irányítószám" inputMode="numeric" {...text("postalCode")} />
        <Field label="Város" {...text("city")} />
      </Section>

      <Section
        title="Cégadatok"
        hint="Impresszum a lábléc alján és az adatkezelési tájékoztatóban. Az üres mezők nem jelennek meg."
      >
        <Field
          label="Cégnév"
          placeholder="pl. Bajor Vendéglátó Kft."
          className="sm:col-span-2"
          {...text("companyName")}
        />
        <Field label="Székhely" className="sm:col-span-2" {...text("companyAddress")} />
        <Field label="Adószám" placeholder="12345678-1-42" {...text("taxNumber")} />
        <Field label="Cégjegyzékszám" placeholder="01-09-123456" {...text("regNumber")} />
      </Section>

      <Section
        title="Közösségi oldalak"
        hint="A teljes profil-link (https://…). Üresen hagyva nem jelenik meg."
      >
        {SOCIAL_NETWORKS.map((n) => (
          <Field
            key={n}
            id={`site-socials.${n}`}
            label={n}
            type="url"
            inputMode="url"
            placeholder={`https://www.${n.toLowerCase()}.com/…`}
            value={f.socials[n]}
            onChange={(v) => set("socials", { ...f.socials, [n]: v })}
            error={err(`socials.${n}`)}
          />
        ))}
      </Section>

      <Card>
        <h2 className="font-display text-2xl">Nyitvatartás</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ebből számoljuk a foglalható időpontokat is. Ha a zárás korábbi, mint a nyitás, az éjfél
          utáni zárást jelent (pl. 12:00–01:00).
        </p>
        <ul className="mt-5 divide-y divide-border">
          {f.hours.map((d, i) => (
            <li key={d.day} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="w-24 font-bold">{WEEKDAY_LABELS[d.day]}</span>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary"
                  checked={d.open}
                  onChange={(e) => setDay(i, { open: e.target.checked })}
                />
                Nyitva
              </label>
              <Swap id={d.open ? "open" : "closed"}>
                {d.open ? (
                  <span className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`site-hours.${i}.opens`}>
                      {WEEKDAY_LABELS[d.day]} nyitás
                    </label>
                    <input
                      id={`site-hours.${i}.opens`}
                      type="time"
                      className={cn(inputClass, "w-32 py-2")}
                      value={d.opens}
                      onChange={(e) => setDay(i, { opens: e.target.value })}
                    />
                    –
                    <label className="sr-only" htmlFor={`site-hours.${i}.closes`}>
                      {WEEKDAY_LABELS[d.day]} zárás
                    </label>
                    <input
                      id={`site-hours.${i}.closes`}
                      type="time"
                      className={cn(inputClass, "w-32 py-2")}
                      aria-invalid={err(`hours.${i}.closes`) ? true : undefined}
                      value={d.closes}
                      onChange={(e) => setDay(i, { closes: e.target.value })}
                    />
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Zárva</span>
                )}
              </Swap>
              <Collapse open={Boolean(err(`hours.${i}.closes`))} className="basis-full">
                <p className="text-sm font-bold text-primary-glow">{err(`hours.${i}.closes`)}</p>
              </Collapse>
            </li>
          ))}
        </ul>
      </Card>

      <Section
        title="Foglalási szabályok"
        hint="Az online asztalfoglalás ezek alapján kínál időpontokat."
      >
        {BOOKING_FIELDS.map(([k, label, unit]) => (
          <Field
            key={k}
            id={`site-booking.${k}`}
            label={`${label} (${unit})`}
            inputMode="numeric"
            value={f.booking[k]}
            onChange={(v) => set("booking", { ...f.booking, [k]: v })}
            error={err(`booking.${k}`)}
          />
        ))}
      </Section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" disabled={save.isPending} className="shadow-gold">
          {save.isPending ? "Mentés…" : "Mentés"}
        </Button>
      </div>
    </form>
  );
}

export function SiteDetailsEditor() {
  const query = useSiteDetails();
  return (
    <>
      <PageTitle>Adatok</PageTitle>
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Minden adat, ami a weboldalon megjelenik, innen jön: elég itt egyszer átírni.
      </p>
      {query.isError ? (
        <Card>
          <p className="mb-3">Nem sikerült betölteni az adatokat.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Újrapróbálom
          </Button>
        </Card>
      ) : query.isPending ? (
        <p className="text-muted-foreground">Betöltés…</p>
      ) : (
        <Form initial={query.data} />
      )}
    </>
  );
}
