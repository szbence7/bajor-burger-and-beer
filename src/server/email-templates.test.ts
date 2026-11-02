import { describe, expect, it } from "vitest";
import type { SiteInfo } from "@/data/info";
import { buildEmail, type ReservationDetails } from "./email-templates";

const site = {
  name: "Bajor Burger & Beer",
  contact: {
    address: "1075 Budapest, Kazinczy utca 12.",
    phone: "+36 1 234 5678",
    email: "hello@bajorburger.hu",
  },
  booking: { holdMinutes: 15 },
} as SiteInfo;

const reservation: ReservationDetails = {
  id: "00000000-0000-4000-8000-000000000000",
  date: "2026-11-10",
  time: "18:00",
  partySize: 4,
  name: 'Teszt <script>alert("x")</script>',
  phone: "+36 30 123 4567",
  email: "vendeg@example.com",
  note: "Születésnap",
};

describe("buildEmail", () => {
  it("escapes guest input in the HTML but keeps it readable in the text part", () => {
    const mail = buildEmail("guest_received", reservation, site, reservation.email);
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.text).toContain('Kedves Teszt <script>alert("x")</script>!');
    expect(mail.replyTo).toBe("hello@bajorburger.hu");
    expect(mail.text).toContain("2026. november 10., kedd");
  });

  it("sends the staff the guest's contact details, a link to the admin and reply-to the guest", () => {
    const mail = buildEmail("staff_new", reservation, site, "staff@example.com");
    expect(mail.to).toBe("staff@example.com");
    expect(mail.subject).toBe("Új foglalás: 2026. november 10., kedd 18:00, 4 fő");
    expect(mail.text).toContain("Telefon: +36 30 123 4567");
    expect(mail.text).toContain("Megjegyzés: Születésnap");
    expect(mail.text).toMatch(/\/admin$/m);
    expect(mail.replyTo).toBe("vendeg@example.com");
  });

  it("quotes the staff's message with a decision", () => {
    const mail = buildEmail(
      "guest_rejected",
      { ...reservation, decisionNote: "Telt ház <b>van</b>" },
      site,
      reservation.email,
    );
    expect(mail.text).toContain("„Telt ház <b>van</b>”");
    expect(mail.html).toContain("Telt ház &lt;b&gt;van&lt;/b&gt;");
    expect(mail.text).toMatch(/\/foglalas$/m);
  });
});

describe("buildAccountEmail", () => {
  it("sends the temporary password and a sign-in link, and explains the 2FA step", async () => {
    const { buildAccountEmail } = await import("./email-templates");
    const mail = buildAccountEmail("admin_invite", site, "uj@bajor.hu", "Abc23xyzQRst");
    expect(mail.to).toBe("uj@bajor.hu");
    expect(mail.text).toContain("Ideiglenes jelszó: Abc23xyzQRst");
    expect(mail.text).toContain("hitelesítő alkalmazást");
    expect(mail.text).toMatch(/\/admin$/m);
  });
});
