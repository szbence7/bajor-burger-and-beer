import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReservationDetails } from "./email-templates";

const insert = vi.fn();
vi.mock("./supabase", () => ({
  getServiceSupabase: () => ({ from: () => ({ insert }) }),
}));
vi.mock("./content", () => ({
  getSiteInfo: () =>
    Promise.resolve({
      name: "Bajor Burger & Beer",
      contact: { address: "Cím", phone: "+36 1 234 5678", email: "hello@bajor.hu" },
      booking: { holdMinutes: 15 },
    }),
}));
const sendMail = vi.fn();
vi.mock("./mailer", () => ({ sendMail }));

const { deliver, deliverAccountEmail, onReservationCreated } = await import("./notifications");

const reservation: ReservationDetails = {
  id: "00000000-0000-4000-8000-000000000001",
  date: "2026-11-10",
  time: "18:00",
  partySize: 2,
  name: "Teszt Elek",
  phone: "+36 30 123 4567",
  email: "vendeg@example.com",
  note: "",
};

beforeEach(() => {
  insert.mockReset().mockResolvedValue({ error: null });
  sendMail.mockReset().mockResolvedValue({ status: "sent" });
  delete process.env["NOTIFY_STAFF_EMAIL"];
});

describe("notifications", () => {
  it("emails the guest and the staff about a new booking and logs both", async () => {
    await onReservationCreated(reservation);
    expect(sendMail.mock.calls.map(([m]) => m.to).sort()).toEqual([
      "hello@bajor.hu",
      "vendeg@example.com",
    ]);
    expect(insert).toHaveBeenCalledWith({
      reservation_id: reservation.id,
      kind: "staff_new",
      recipient: "hello@bajor.hu",
      status: "sent",
      error: null,
    });
  });

  it("sends staff alerts to NOTIFY_STAFF_EMAIL when set", async () => {
    process.env["NOTIFY_STAFF_EMAIL"] = "konyha@bajor.hu";
    await deliver("staff_new", reservation);
    expect(sendMail.mock.calls[0]?.[0].to).toBe("konyha@bajor.hu");
  });

  it("logs skipped and failed sends with the reason, and never throws", async () => {
    sendMail.mockResolvedValueOnce({ status: "skipped", error: "SMTP nincs beállítva" });
    await expect(deliver("guest_confirmed", reservation)).resolves.toBe("skipped");
    expect(insert).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "skipped", error: "SMTP nincs beállítva" }),
    );

    vi.spyOn(console, "error").mockImplementation(() => {});
    sendMail.mockRejectedValueOnce(new Error("boom"));
    await expect(deliver("guest_rejected", reservation)).resolves.toBe("failed");
    expect(insert).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "guest_rejected", status: "failed", error: "boom" }),
    );
  });
});

it("preserves successful delivery when the notification log is unavailable", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  insert.mockRejectedValue(new Error("Database unavailable"));
  await expect(deliver("guest_confirmed", reservation)).resolves.toBe("sent");
  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(insert).toHaveBeenCalledTimes(1);
});

it("returns a failed account email so the admin can hand over the password", async () => {
  sendMail.mockRejectedValueOnce(new Error("Unexpected provider failure"));
  await expect(deliverAccountEmail("admin_invite", "staff@example.com", "temporary")).resolves.toBe(
    "failed",
  );
  expect(insert).toHaveBeenCalledWith(
    expect.objectContaining({ kind: "admin_invite", status: "failed" }),
  );
});
