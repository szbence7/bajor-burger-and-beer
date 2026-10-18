import { describe, expect, it } from "vitest";
import { reservationInput, type ReservationInput } from "./schema";

const valid = {
  date: "2026-10-20",
  time: "18:00",
  partySize: 4,
  name: "  Teszt Elek ",
  phone: "+36 30 123 4567",
  email: "teszt@example.com",
  note: "",
  consent: true,
  website: "",
};

const messageFor = (data: object, field: keyof ReservationInput) => {
  const result = reservationInput.safeParse(data);
  return result.success ? undefined : result.error.flatten().fieldErrors[field]?.[0];
};

describe("reservationInput", () => {
  it("accepts a valid booking and trims text", () => {
    const result = reservationInput.parse(valid);
    expect(result.name).toBe("Teszt Elek");
  });

  it("requires consent, with a Hungarian message", () => {
    expect(messageFor({ ...valid, consent: false }, "consent")).toBe(
      "A foglaláshoz el kell fogadnod az adatkezelési tájékoztatót.",
    );
  });

  it("rejects bad phone numbers and emails", () => {
    expect(messageFor({ ...valid, phone: "hívj fel" }, "phone")).toBe(
      "Adj meg egy érvényes telefonszámot.",
    );
    expect(messageFor({ ...valid, email: "teszt@" }, "email")).toBe(
      "Adj meg egy érvényes e-mail-címet.",
    );
  });

  it("rejects malformed dates and times", () => {
    expect(reservationInput.safeParse({ ...valid, date: "20/10/2026" }).success).toBe(false);
    expect(reservationInput.safeParse({ ...valid, time: "18" }).success).toBe(false);
  });
});
