import { describe, expect, it } from "vitest";
import { images, resolveImage, resolveDishImage } from "@/data/images";
import { openingHourRow, siteSettingsRow, toSiteInfo } from "./mappers";

describe("resolveImage", () => {
  it("never renders retired dummy image keys, including existing database values", () => {
    for (const key of [
      "burgerHero",
      "burgerSpicy",
      "burgerVeggie",
      "placePeople",
      "placeTap",
      "foodTable",
      "eventNight",
    ]) {
      expect(resolveImage(key)).toBeUndefined();
      expect(resolveDishImage(key, "Unknown monthly special")).toBeUndefined();
    }
  });
  it("uses an exact original dish photo or a staff upload without inventing a fallback", () => {
    expect(resolveDishImage(null, "LÁVA BURGER")).toBe(images.lavaBurger);
    expect(resolveDishImage(null, "Chili Surf & Turf burger")).toBeUndefined();
    expect(resolveDishImage("https://cdn.example.hu/staff.webp", "Classic Beef")).toBe(
      "https://cdn.example.hu/staff.webp",
    );
  });

  it("maps bundled image keys, keeps absolute URLs, rejects the rest", () => {
    expect(resolveImage("classicBeef")).toBe(images.classicBeef);
    expect(resolveImage("https://cdn.example.hu/a.webp")).toBe("https://cdn.example.hu/a.webp");
    expect(resolveImage("toString")).toBeUndefined();
    expect(resolveImage("nope.png")).toBeUndefined();
    expect(resolveImage(null)).toBeUndefined();
  });
});

const baseSettings = {
  restaurant_name: "Bajor Burger & Beer",
  company_name: "Bajor Kft.",
  company_address: "1075 Budapest, Kazinczy utca 12.",
  tax_number: "12345678-2-42",
  company_reg_number: "01-09-123456",
  street: "Kazinczy utca 12.",
  postal_code: "1075",
  city: "Budapest",
  country: "HU",
  phone: "+36 1 234 5678",
  email: "hello@bajorburger.hu",
  socials: [{ label: "Instagram", href: "https://instagram.com" }],
  booking_slot_minutes: 30,
  booking_duration_minutes: 90,
  booking_capacity: 40,
  booking_max_party_size: 8,
  booking_days_ahead: 60,
  booking_min_notice_minutes: 120,
  booking_hold_minutes: 15,
  menu_pdf_path: null,
  menu_pdf_updated_at: null,
  menu_pdf_pages: [],
  updated_at: "2026-10-18T10:00:00Z",
};

describe("toSiteInfo", () => {
  it("builds contact, trims times to HH:MM and maps booking settings", () => {
    const settings = siteSettingsRow.parse(baseSettings);
    const hours = [
      { label: "Hétfő", days: ["Monday"], opens: null, closes: null },
      { label: "Péntek", days: ["Friday"], opens: "12:00:00", closes: "01:00:00" },
    ].map((h) => openingHourRow.parse(h));

    const info = toSiteInfo(settings, hours);

    expect(info.contact.address).toBe("1075 Budapest, Kazinczy utca 12.");
    expect(info.openingHours[1]).toEqual({
      label: "Péntek",
      days: ["Friday"],
      opens: "12:00",
      closes: "01:00",
    });
    expect(info.booking).toMatchObject({ maxPartySize: 8, capacity: 40, holdMinutes: 15 });
    expect(info.menuPdf).toBeNull();
    expect(info.name).toBe("Bajor Burger & Beer");
    expect(info.company).toEqual({
      name: "Bajor Kft.",
      address: "1075 Budapest, Kazinczy utca 12.",
      taxNumber: "12345678-2-42",
      regNumber: "01-09-123456",
    });
  });

  it("rejects unknown weekdays", () => {
    expect(() =>
      openingHourRow.parse({ label: "x", days: ["Funday"], opens: null, closes: null }),
    ).toThrow();
  });
});

describe("toSiteInfo menu pages", () => {
  it("turns stored page file names into public Storage URLs", () => {
    process.env["SUPABASE_URL"] = "http://db.internal:8000";
    process.env["SUPABASE_PUBLIC_URL"] = "https://db.example.hu/";
    const settings = siteSettingsRow.parse({
      ...baseSettings,
      menu_pdf_path: "etlap-1.pdf",
      menu_pdf_updated_at: "2026-11-02T10:00:00Z",
      menu_pdf_pages: [
        {
          file: "etlap-1-1.webp",
          small: "etlap-1-1-sm.webp",
          width: 1600,
          height: 2263,
          text: "Burgerek",
        },
      ],
    });
    expect(toSiteInfo(settings, []).menuPdf).toEqual({
      updatedAt: "2026-11-02T10:00:00Z",
      pages: [
        {
          src: "https://db.example.hu/storage/v1/object/public/menu/etlap-1-1.webp",
          srcSmall: "https://db.example.hu/storage/v1/object/public/menu/etlap-1-1-sm.webp",
          width: 1600,
          height: 2263,
          text: "Burgerek",
        },
      ],
    });
  });

  it("rejects page names that are not plain WebP file names", () => {
    expect(() =>
      siteSettingsRow.parse({
        ...baseSettings,
        menu_pdf_pages: [{ file: "../x.webp", small: "x.webp", width: 1, height: 1, text: "" }],
      }),
    ).toThrow();
  });
});
