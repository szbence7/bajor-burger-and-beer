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

/** "On Tuesday" etc., for "Zárva · nyitás: kedden 12:00". */
const WEEKDAY_ON: Record<Weekday, string> = {
  Monday: "hétfőn",
  Tuesday: "kedden",
  Wednesday: "szerdán",
  Thursday: "csütörtökön",
  Friday: "pénteken",
  Saturday: "szombaton",
  Sunday: "vasárnap",
};

export type OpenStatus =
  { open: true; until: string } | { open: false; next: { day: string; time: string } | null };

/** Budapest weekday (Monday = 0) and "HH:MM", whatever the device's time zone. */
export function budapestClock(now: Date): { day: number; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Budapest",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: WEEKDAYS.indexOf(get("weekday") as Weekday),
    time: `${get("hour")}:${get("minute")}`,
  };
}

/**
 * Whether the restaurant is open right now (Budapest time), and until when; if closed, when
 * it opens next ("ma", "holnap" or "kedden"). A closing time earlier than the opening time
 * means after midnight, so Friday 12:00–01:00 is still open early on Saturday.
 */
export function openStatus(rows: OpeningHour[], now = new Date()): OpenStatus {
  const days = toDayHours(rows);
  const { day, time } = budapestClock(now);
  const today = days[day];
  const yesterday = days[(day + 6) % 7];
  if (yesterday?.open && yesterday.closes < yesterday.opens && time < yesterday.closes) {
    return { open: true, until: yesterday.closes };
  }
  if (today?.open && time >= today.opens) {
    if (today.closes < today.opens || time < today.closes) {
      return { open: true, until: today.closes };
    }
  }
  if (today?.open && time < today.opens) {
    return { open: false, next: { day: "ma", time: today.opens } };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const d = days[(day + ahead) % 7];
    if (d?.open) {
      return {
        open: false,
        next: { day: ahead === 1 ? "holnap" : WEEKDAY_ON[d.day], time: d.opens },
      };
    }
  }
  return { open: false, next: null };
}
