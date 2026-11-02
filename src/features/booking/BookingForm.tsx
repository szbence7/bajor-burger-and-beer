import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { ctaClass } from "@/lib/cta";
import { addDays, formatDateHu, todayInBudapest, weekdayOf } from "@/lib/date";
import { useSiteInfo } from "@/lib/site-info";
import { cn } from "@/lib/utils";
import { createReservation, getAvailability } from "./api";
import { BookingCalendar } from "./Calendar";
import { Collapse, Swap } from "@/components/motion";
import { useSmoothList } from "@/lib/motion";
import {
  BOOKING_ERRORS,
  SLOT_ERRORS,
  reservationInput,
  type BookingErrorCode,
  type ReservationInput,
} from "./schema";

const field =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none [color-scheme:dark] focus:border-primary aria-[invalid=true]:border-primary-glow";
const labelClass = "mb-2 block font-bold";
const chip = (selected: boolean) =>
  cn(
    "font-bold transition-colors border-2",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border hover:border-primary",
  );

type FormState = Omit<ReservationInput, "consent"> & { consent: boolean };
type FieldName = keyof FormState;
type FieldErrors = Partial<Record<FieldName, string>>;

/** Budapest's today; computed after mount so server and client markup match. */
function useToday() {
  const [today, setToday] = useState("");
  useEffect(() => setToday(todayInBudapest()), []);
  return today;
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  return (
    <Collapse open={Boolean(message)}>
      <p id={id} className="pt-2 text-sm font-bold text-primary-glow">
        {message}
      </p>
    </Collapse>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-border bg-background px-4 py-3 text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * Two-step table booking: date, party size and an available time, then contact details and
 * consent, then a confirmation. Slots come from the database, which also re-checks every rule
 * when the booking is stored.
 */
export function BookingForm() {
  const { contact, openingHours, booking } = useSiteInfo();
  const queryClient = useQueryClient();
  const today = useToday();
  const maxDate = today ? addDays(today, booking.daysAhead) : "";
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [f, setF] = useState<FormState>({
    date: "",
    time: "",
    partySize: Math.min(2, booking.maxPartySize),
    name: "",
    phone: "",
    email: "",
    note: "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<BookingErrorCode | null>(null);
  const set = <K extends FieldName>(k: K, v: FormState[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // Move focus to the new step's heading so keyboard and screen reader users follow along.
  // The steps cross-fade, so the new heading focuses itself when it mounts.
  const focusNext = useRef(false);
  const headingRef = (el: HTMLHeadingElement | null) => {
    if (el && focusNext.current) {
      focusNext.current = false;
      el.focus();
    }
  };
  const goTo = (next: 1 | 2 | 3) => {
    focusNext.current = true;
    setStep(next);
  };

  const dateInRange = Boolean(f.date && today && f.date >= today && f.date <= maxDate);
  const isClosed = (iso: string) =>
    !openingHours.some((h) => h.opens && h.days.includes(weekdayOf(iso)));
  const closed = Boolean(f.date) && isClosed(f.date);
  const availability = useQuery({
    queryKey: ["availability", f.date, f.partySize],
    queryFn: () => getAvailability({ data: { date: f.date, partySize: f.partySize } }),
    enabled: step === 1 && dateInRange && !closed,
    staleTime: 30_000,
  });
  const slots = availability.data;

  // A slot picked earlier may not fit a bigger party (or may have filled up meanwhile).
  useEffect(() => {
    if (f.time && slots && !slots.some((s) => s.time === f.time && s.available)) {
      setF((p) => ({ ...p, time: "" }));
    }
  }, [slots, f.time]);

  const submit = useMutation({
    mutationFn: (data: ReservationInput) => createReservation({ data }),
    onSuccess: (result) => {
      if (result.ok) {
        goTo(3);
        return;
      }
      setSubmitError(result.error);
      if (SLOT_ERRORS.includes(result.error)) {
        void queryClient.invalidateQueries({ queryKey: ["availability"] });
      }
    },
    onError: () => setSubmitError("unknown"),
  });

  const canContinue = dateInRange && Boolean(f.time);
  // Loading → times → "no free time" swaps ease instead of jumping.
  const slotStateRef = useSmoothList<HTMLDivElement>();

  // On phones the calendar fills the screen: after picking a day, bring the times into view.
  const slotsRef = useRef<HTMLDivElement>(null);
  const pickDate = (d: string) => {
    const first = !f.date;
    set("date", d);
    if (!first) return;
    setTimeout(() => {
      const el = slotsRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.6) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // 96 px clears the fixed header.
        window.scrollBy({ top: top - 96, behavior: reduce ? "auto" : "smooth" });
      }
    }, 150);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const parsed = reservationInput.safeParse(f);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const name = issue.path[0] as FieldName;
        fieldErrors[name] ??= issue.message;
      }
      setErrors(fieldErrors);
      const first = Object.keys(fieldErrors)[0];
      if (first) document.getElementById(`booking-${first}`)?.focus();
      return;
    }
    submit.mutate(parsed.data);
  };

  const backToSlots = () => {
    setSubmitError(null);
    setF((p) => ({ ...p, time: "" }));
    goTo(1);
  };

  const describedBy = (name: FieldName) => (errors[name] ? `booking-${name}-error` : undefined);
  const invalid = (name: FieldName) => (errors[name] ? true : undefined);

  let slotContent: ReactNode;
  if (today && !dateInRange) {
    slotContent = (
      <Notice>Online ma és a következő {booking.daysAhead} nap között foglalhatsz.</Notice>
    );
  } else if (closed) {
    slotContent = <Notice>Ezen a napon zárva tartunk. Válassz másik napot!</Notice>;
  } else if (availability.isError) {
    slotContent = (
      <Notice>
        Nem sikerült betölteni az időpontokat.{" "}
        <button
          type="button"
          onClick={() => void availability.refetch()}
          className="font-bold text-primary underline underline-offset-4"
        >
          Újrapróbálom
        </button>
      </Notice>
    );
  } else if (!slots) {
    slotContent = <Notice>Szabad időpontok betöltése…</Notice>;
  } else if (slots.length === 0) {
    slotContent = <Notice>Erre a napra már nincs online foglalható időpont.</Notice>;
  } else {
    slotContent = (
      <div key={f.date} className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {slots.map((s, i) => (
          <button
            key={s.time}
            type="button"
            // Times drift in one after another when a day is picked.
            style={{ animationDelay: `${Math.min(i, 24) * 25}ms` }}
            disabled={!s.available}
            aria-pressed={f.time === s.time}
            onClick={() => set("time", s.time)}
            className={cn(
              "slot-in rounded-2xl py-3",
              chip(f.time === s.time),
              "disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:line-through disabled:opacity-60",
            )}
          >
            {s.time}
            {!s.available && <span className="sr-only"> (betelt)</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-border bg-card p-5 sm:p-8">
      {step < 3 && (
        <div className="mb-8 flex gap-3" aria-hidden>
          {[1, 2].map((s) => (
            <span
              key={s}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-500",
                step >= s ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      )}
      <Swap id={step}>
        {step === 1 && (
          <div className="space-y-6">
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-4xl outline-none sm:text-5xl"
            >
              Mikor jössz?
            </h3>
            <div>
              <p id="booking-date-label" className={labelClass}>
                Dátum
              </p>
              <div role="group" aria-labelledby="booking-date-label">
                <BookingCalendar
                  value={f.date}
                  min={today}
                  max={maxDate}
                  isClosed={isClosed}
                  onChange={pickDate}
                />
              </div>
              {!f.date && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Válassz egy napot, és megmutatjuk a szabad időpontokat.
                </p>
              )}
            </div>
            {/* Opens smoothly below the calendar once a day is picked (0fr → 1fr grid rows). */}
            <div
              ref={slotsRef}
              inert={!f.date}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none",
                f.date ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0 space-y-6 overflow-hidden">
                {f.date && (
                  <>
                    <fieldset>
                      <legend className={labelClass}>Időpont — {formatDateHu(f.date)}</legend>
                      <div ref={slotStateRef}>{slotContent}</div>
                    </fieldset>
                    <fieldset>
                      <legend className={labelClass}>Hányan jöttök? {f.partySize} fő</legend>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: booking.maxPartySize }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={f.partySize === n}
                            aria-label={`${n} fő`}
                            onClick={() => set("partySize", n)}
                            className={cn("h-12 w-12 rounded-full", chip(f.partySize === n))}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => goTo(2)}
              className={ctaClass("gold", "w-full disabled:opacity-40 sm:w-auto")}
            >
              Tovább
            </button>
          </div>
        )}
        {step === 2 && (
          <form className="relative space-y-4" onSubmit={onSubmit} noValidate>
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-4xl outline-none sm:text-5xl"
            >
              Az adataid
            </h3>
            <p className="text-muted-foreground">
              {formatDateHu(f.date)}, {f.time} — {f.partySize} fő
            </p>
            <div>
              <label htmlFor="booking-name" className={labelClass}>
                Név
              </label>
              <input
                id="booking-name"
                autoComplete="name"
                className={field}
                value={f.name}
                aria-invalid={invalid("name")}
                aria-describedby={describedBy("name")}
                onChange={(e) => set("name", e.target.value)}
              />
              <FieldError id="booking-name-error" message={errors.name} />
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
                aria-invalid={invalid("phone")}
                aria-describedby={describedBy("phone")}
                onChange={(e) => set("phone", e.target.value)}
              />
              <FieldError id="booking-phone-error" message={errors.phone} />
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
                aria-invalid={invalid("email")}
                aria-describedby={describedBy("email")}
                onChange={(e) => set("email", e.target.value)}
              />
              <FieldError id="booking-email-error" message={errors.email} />
            </div>
            <div>
              <label htmlFor="booking-note" className={labelClass}>
                Megjegyzés <span className="font-normal text-muted-foreground">(nem kötelező)</span>
              </label>
              <textarea
                id="booking-note"
                className={field}
                rows={3}
                placeholder="pl. születésnap, babakocsi"
                value={f.note}
                aria-invalid={invalid("note")}
                aria-describedby={describedBy("note")}
                onChange={(e) => set("note", e.target.value)}
              />
              <FieldError id="booking-note-error" message={errors.note} />
            </div>
            {/* Honeypot: off-screen and skipped by keyboard; only bots fill it in. */}
            <div aria-hidden className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
              <label htmlFor="booking-website">Weboldal</label>
              <input
                id="booking-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={f.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="booking-consent" className="flex cursor-pointer items-start gap-3">
                <input
                  id="booking-consent"
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                  checked={f.consent}
                  aria-invalid={invalid("consent")}
                  aria-describedby={describedBy("consent")}
                  onChange={(e) => set("consent", e.target.checked)}
                />
                <span>
                  Elolvastam és elfogadom az{" "}
                  <Link
                    to="/adatkezeles"
                    target="_blank"
                    className="font-bold text-primary underline underline-offset-4"
                  >
                    adatkezelési tájékoztatót
                  </Link>
                  .
                </span>
              </label>
              <FieldError id="booking-consent-error" message={errors.consent} />
            </div>
            <Collapse open={Boolean(submitError)}>
              {submitError && (
                <div role="alert" className="rounded-2xl border-2 border-primary-glow p-4">
                  <p className="font-bold">{BOOKING_ERRORS[submitError]}</p>
                  {SLOT_ERRORS.includes(submitError) && (
                    <button
                      type="button"
                      onClick={backToSlots}
                      className="mt-2 font-bold text-primary underline underline-offset-4"
                    >
                      Másik időpontot választok
                    </button>
                  )}
                </div>
              )}
            </Collapse>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={() => goTo(1)} className={ctaClass("outline")}>
                Vissza
              </button>
              <button
                type="submit"
                disabled={submit.isPending}
                className={ctaClass("gold", "disabled:opacity-40")}
              >
                {submit.isPending ? "Küldés…" : "Foglalás elküldése"}
              </button>
            </div>
          </form>
        )}
        {step === 3 && (
          <div className="py-10 text-center" role="status">
            <span className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-10 w-10" />
            </span>
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="break-words font-display text-4xl outline-none sm:text-6xl"
            >
              Köszönjük, {f.name.trim()}!
            </h3>
            <p className="mt-4 text-muted-foreground">
              Megkaptuk a foglalásodat. Hamarosan visszaigazoljuk e-mailben vagy telefonon.
            </p>
            <dl className="mx-auto mt-8 max-w-md divide-y divide-border rounded-3xl border border-border px-6 text-left">
              {[
                ["Dátum", formatDateHu(f.date)],
                ["Időpont", f.time],
                ["Létszám", `${f.partySize} fő`],
                ["Név", f.name.trim()],
                ["Telefon", f.phone.trim()],
                ["E-mail", f.email.trim()],
              ].map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{term}</dt>
                  <dd className="min-w-0 text-right font-bold [overflow-wrap:anywhere]">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
              Az asztalt {booking.holdMinutes} percig tartjuk. Ha mégsem tudsz jönni, kérjük, szólj:{" "}
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="font-bold text-primary"
              >
                {contact.phone}
              </a>
            </p>
          </div>
        )}
      </Swap>
    </div>
  );
}
