import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReservationInput } from "@/features/booking/schema";

const insert = vi.fn();
vi.mock("./supabase", () => ({
  getSupabase: () => ({ from: () => ({ insert }) }),
}));
const notify = vi.fn(() => Promise.resolve());
vi.mock("./notifications", () => ({ onReservationCreated: notify }));

const { submitReservation } = await import("./booking");

const input: ReservationInput = {
  date: "2026-10-20",
  time: "18:00",
  partySize: 4,
  name: "Teszt Elek",
  phone: "+36 30 123 4567",
  email: "teszt@example.com",
  note: "",
  consent: true,
  website: "",
};

let ip = 0;
const nextIp = () => `10.0.0.${++ip}`;

beforeEach(() => {
  insert.mockReset().mockResolvedValue({ error: null });
  notify.mockClear();
});

describe("submitReservation", () => {
  it("inserts only guest-supplied columns and calls the notification hook", async () => {
    await expect(submitReservation(input, nextIp())).resolves.toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({
      date: "2026-10-20",
      time: "18:00",
      party_size: 4,
      name: "Teszt Elek",
      phone: "+36 30 123 4567",
      email: "teszt@example.com",
      note: null,
      consent_at: expect.any(String),
    });
    expect(notify).toHaveBeenCalledOnce();
  });

  it("pretends success for honeypot hits without storing anything", async () => {
    const result = await submitReservation({ ...input, website: "http://spam" }, nextIp());
    expect(result).toEqual({ ok: true });
    expect(insert).not.toHaveBeenCalled();
  });

  it("maps database rule errors to their codes and hides unexpected ones", async () => {
    insert.mockResolvedValueOnce({ error: { code: "P0001", message: "slot_full" } });
    await expect(submitReservation(input, nextIp())).resolves.toEqual({
      ok: false,
      error: "slot_full",
    });

    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    insert.mockResolvedValueOnce({ error: { code: "42501", message: "permission denied" } });
    await expect(submitReservation(input, nextIp())).resolves.toEqual({
      ok: false,
      error: "unknown",
    });
    expect(notify).not.toHaveBeenCalled();
  });

  it("allows 5 attempts per IP per hour", async () => {
    const sameIp = nextIp();
    for (let i = 0; i < 5; i++) {
      await expect(submitReservation(input, sameIp)).resolves.toEqual({ ok: true });
    }
    await expect(submitReservation(input, sameIp)).resolves.toEqual({
      ok: false,
      error: "rate_limited",
    });
    await expect(submitReservation(input, nextIp())).resolves.toEqual({ ok: true });
    expect(insert).toHaveBeenCalledTimes(6);
  });
});
