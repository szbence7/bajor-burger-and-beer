import { describe, expect, it } from "vitest";
import { groupDayHours, toDayHours } from "./opening-hours";

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
