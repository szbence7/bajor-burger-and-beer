import { describe, expect, it } from "vitest";
import { addDays, formatDateHu, todayInBudapest, weekdayOf } from "./date";

describe("date helpers", () => {
  it("uses Budapest's calendar day, not UTC's", () => {
    // 23:30 UTC on 19 Oct is already 20 Oct in Budapest (UTC+2 in summer time).
    expect(todayInBudapest(new Date("2026-10-19T23:30:00Z"))).toBe("2026-10-20");
    expect(todayInBudapest(new Date("2026-10-19T21:00:00Z"))).toBe("2026-10-19");
  });

  it("adds days across month ends and the DST change", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-10-24", 60)).toBe("2026-12-23");
  });

  it("knows the weekday and formats in Hungarian", () => {
    expect(weekdayOf("2026-10-20")).toBe("Tuesday");
    expect(weekdayOf("2026-10-25")).toBe("Sunday");
    expect(formatDateHu("2026-10-20")).toBe("2026. október 20., kedd");
  });
});
