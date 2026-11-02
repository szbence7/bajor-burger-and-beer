// The admin edits opening hours per weekday; the site stores and shows them grouped
// ("Kedd – Csütörtök 12:00–23:00"). These convert between the two.
import { WEEKDAYS, type OpeningHour, type Weekday } from "@/data/info";

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  Monday: "Hétfő",
  Tuesday: "Kedd",
  Wednesday: "Szerda",
  Thursday: "Csütörtök",
  Friday: "Péntek",
  Saturday: "Szombat",
  Sunday: "Vasárnap",
};

export interface DayHours {
  day: Weekday;
  open: boolean;
  /** "HH:MM"; ignored when closed. */
  opens: string;
  closes: string;
}

/** One entry per weekday, Monday first. Days in no row are closed. */
export function toDayHours(rows: OpeningHour[]): DayHours[] {
  return WEEKDAYS.map((day) => {
    const row = rows.find((r) => r.days.includes(day));
    return row?.opens && row.closes
      ? { day, open: true, opens: row.opens, closes: row.closes }
      : { day, open: false, opens: "12:00", closes: "22:00" };
  });
}

/** Groups consecutive weekdays with the same hours into labelled rows. */
export function groupDayHours(days: DayHours[]): OpeningHour[] {
  const key = (d: DayHours) => (d.open ? `${d.opens}-${d.closes}` : "closed");
  const groups: DayHours[][] = [];
  for (const d of days) {
    const last = groups.at(-1);
    if (last && key(last[0]!) === key(d)) last.push(d);
    else groups.push([d]);
  }
  return groups.map((g) => {
    const first = g[0]!;
    const lastDay = g.at(-1)!;
    return {
      label:
        g.length === 1
          ? WEEKDAY_LABELS[first.day]
          : `${WEEKDAY_LABELS[first.day]} – ${WEEKDAY_LABELS[lastDay.day]}`,
      days: g.map((d) => d.day),
      opens: first.open ? first.opens : null,
      closes: first.open ? first.closes : null,
    };
  });
}
