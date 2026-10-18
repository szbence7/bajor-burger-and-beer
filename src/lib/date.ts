import { WEEKDAYS, type Weekday } from "@/data/info";

/** Today's date in Budapest as YYYY-MM-DD, whatever the device's time zone. */
export function todayInBudapest(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Calendar arithmetic on YYYY-MM-DD strings (UTC-based, so DST never shifts the day). */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(iso: string): Weekday {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return WEEKDAYS[(day + 6) % 7]!;
}

/** "2026. október 20., kedd" */
export function formatDateHu(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("hu-HU", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}
