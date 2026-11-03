import { describe, expect, it } from "vitest";
import { groupDayHours, openStatus, toDayHours } from "./opening-hours";

const seed = [
  { label: "Hétfő", days: ["Monday" as const], opens: null, closes: null },
  {
    label: "Kedd – Csütörtök",
    days: ["Tuesday" as const, "Wednesday" as const, "Thursday" as const],
    opens: "12:00",
    closes: "23:00",
  },
  { label: "Péntek", days: ["Friday" as const], opens: "12:00", closes: "01:00" },
  { label: "Szombat", days: ["Saturday" as const], opens: "12:00", closes: "01:00" },
  { label: "Vasárnap", days: ["Sunday" as const], opens: "12:00", closes: "22:00" },
];

describe("opening hours", () => {
  it("expands rows to weekdays and groups consecutive equal days back", () => {
    const days = toDayHours(seed);
    expect(days).toHaveLength(7);
    expect(days[0]).toMatchObject({ day: "Monday", open: false });
    expect(days[4]).toMatchObject({ day: "Friday", open: true, opens: "12:00", closes: "01:00" });
    expect(groupDayHours(days)).toEqual([
      seed[0],
      seed[1],
      { label: "Péntek – Szombat", days: ["Friday", "Saturday"], opens: "12:00", closes: "01:00" },
      seed[4],
    ]);
  });

  it("treats weekdays missing from every row as closed", () => {
    expect(groupDayHours(toDayHours([]))).toEqual([
      {
        label: "Hétfő – Vasárnap",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: null,
        closes: null,
      },
    ]);
  });
});

describe("openStatus", () => {
  // 2026-11-03 is a Tuesday; Budapest is UTC+1 in November.
  const at = (iso: string) => openStatus(seed, new Date(iso));

  it("is open between opening and closing time", () => {
    expect(at("2026-11-03T15:00:00+01:00")).toEqual({ open: true, until: "23:00" });
  });

  it("opens later today before opening time", () => {
    expect(at("2026-11-03T09:30:00+01:00")).toEqual({
      open: false,
      next: { day: "ma", time: "12:00" },
    });
  });

  it("points to tomorrow after closing time", () => {
    expect(at("2026-11-03T23:10:00+01:00")).toEqual({
      open: false,
      next: { day: "holnap", time: "12:00" },
    });
  });

  it("stays open after midnight when closing is past midnight", () => {
    // Saturday 00:30, Friday closes at 01:00.
    expect(at("2026-11-07T00:30:00+01:00")).toEqual({ open: true, until: "01:00" });
  });

  it("skips closed days", () => {
    // Sunday 22:30 → Monday is closed → Tuesday.
    expect(at("2026-11-08T22:30:00+01:00")).toEqual({
      open: false,
      next: { day: "kedden", time: "12:00" },
    });
  });

  it("uses Budapest time whatever the device's zone", () => {
    // 22:30 UTC on Tuesday is 23:30 in Budapest: closed.
    expect(at("2026-11-03T22:30:00Z")).toMatchObject({ open: false });
  });

  it("has no next opening when every day is closed", () => {
    expect(openStatus([], new Date("2026-11-03T12:00:00Z"))).toEqual({ open: false, next: null });
  });
});
