import { useEffect, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatDateHu } from "@/lib/date";
import { cn } from "@/lib/utils";

const WEEKDAY_SHORT = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

/** "2026-11" → first day, days in month, Monday-based offset of the 1st. */
function monthGrid(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  return { days, offset };
}

function shiftMonth(month: string, delta: number): string {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

const monthLabel = (month: string) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString("hu-HU", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
  });

/**
 * Month calendar that is always open: past days, days beyond the booking window and closed
 * days are disabled. Arrow keys move between days. `min` is empty until the client knows
 * today's date (Budapest), so server and client markup match.
 */
export function BookingCalendar({
  value,
  min,
  max,
  isClosed,
  onChange,
}: {
  value: string;
  min: string;
  max: string;
  isClosed: (iso: string) => boolean;
  onChange: (iso: string) => void;
}) {
  const [month, setMonth] = useState("");
  useEffect(() => {
    if (min && !month) setMonth((value || min).slice(0, 7));
  }, [min, month, value]);

  if (!month) {
    return (
      <div className="h-[22rem] max-w-lg animate-pulse rounded-3xl bg-background" aria-hidden />
    );
  }

  const { days, offset } = monthGrid(month);
  const canPrev = month > min.slice(0, 7);
  const canNext = month < max.slice(0, 7);
  const selectable = (iso: string) => iso >= min && iso <= max && !isClosed(iso);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const current = (e.target as HTMLElement).dataset["date"];
    const step = steps[e.key];
    if (!current || !step) return;
    e.preventDefault();
    let next = addDays(current, step);
    // Skip disabled days in the direction of travel, within the booking window.
    while (next >= min && next <= max && !selectable(next)) next = addDays(next, Math.sign(step));
    if (!selectable(next)) return;
    if (next.slice(0, 7) !== month) setMonth(next.slice(0, 7));
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus(),
    );
  };

  return (
    <div className="max-w-lg rounded-3xl border border-border bg-background p-3 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          disabled={!canPrev}
          aria-label="Előző hónap"
          className="grid h-11 w-11 place-items-center rounded-full hover:text-primary disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-2xl" aria-live="polite">
          {monthLabel(month)}
        </p>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={!canNext}
          aria-label="Következő hónap"
          className="grid h-11 w-11 place-items-center rounded-full hover:text-primary disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center" onKeyDown={onKeyDown}>
        {WEEKDAY_SHORT.map((d) => (
          <span
            key={d}
            aria-hidden
            className="pb-1 text-xs font-bold uppercase text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const iso = `${month}-${String(i + 1).padStart(2, "0")}`;
          const enabled = selectable(iso);
          const selected = iso === value;
          const closed = iso >= min && iso <= max && isClosed(iso);
          return (
            <button
              key={iso}
              type="button"
              data-date={iso}
              disabled={!enabled}
              aria-pressed={selected}
              aria-label={`${formatDateHu(iso)}${closed ? " (zárva)" : ""}`}
              onClick={() => onChange(iso)}
              className={cn(
                "mx-auto grid aspect-square w-full max-w-12 place-items-center rounded-full text-base font-bold transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : enabled
                    ? "hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground/40",
                iso === min && !selected && "ring-2 ring-inset ring-primary/60",
                closed && "line-through",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
