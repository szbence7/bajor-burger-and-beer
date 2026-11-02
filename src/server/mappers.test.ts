import { describe, expect, it } from "vitest";
import { images, resolveImage } from "@/data/images";
import {
  beerRow,
  menuItemRow,
  openingHourRow,
  siteSettingsRow,
  toBeer,
  toGalleryItems,
  toMenuItems,
  toSiteInfo,
} from "./mappers";

describe("resolveImage", () => {
  it("maps bundled image keys, keeps absolute URLs, rejects the rest", () => {
    expect(resolveImage("burgerSpicy")).toBe(images.burgerSpicy);
    expect(resolveImage("https://cdn.example.hu/a.webp")).toBe("https://cdn.example.hu/a.webp");
    expect(resolveImage("toString")).toBeUndefined();
    expect(resolveImage("nope.png")).toBeUndefined();
    expect(resolveImage(null)).toBeUndefined();
  });
});

describe("toSiteInfo", () => {
  it("builds contact, trims times to HH:MM and maps booking settings", () => {
    const settings = siteSettingsRow.parse({
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
      updated_at: "2026-10-18T10:00:00Z",
    });
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

describe("toMenuItems", () => {
  const row = (kind: "burger" | "side" | "drink", extra: object = {}) =>
    menuItemRow.parse({
      slug: `${kind}-1`,
      name: kind,
      description: "leírás",
      ingredients: [],
      price: 1990,
      image: null,
      badges: [],
      is_featured: false,
      menu_categories: { kind },
      ...extra,
    });

  it("splits items by category kind into the existing types", () => {
    const menu = toMenuItems([
      row("burger", { image: "burgerVeggie", badges: ["Vega"], is_featured: true }),
      row("side"),
      row("drink", { description: "0,5 l" }),
    ]);
    expect(menu.burgers[0]).toMatchObject({
      id: "burger-1",
      image: images.burgerVeggie,
      badges: ["Vega"],
      featured: true,
    });
    expect(menu.sides[0]).toEqual({
      id: "side-1",
      name: "side",
      description: "leírás",
      price: 1990,
    });
    expect(menu.drinks[0]).toEqual({ id: "drink-1", name: "drink", detail: "0,5 l", price: 1990 });
  });

  it("falls back to the hero burger photo and rejects unknown badges", () => {
    expect(toMenuItems([row("burger")]).burgers[0]?.image).toBe(images.burgerHero);
    expect(() => row("burger", { badges: ["Akció"] })).toThrow();
  });
});

describe("toBeer", () => {
  it("coerces numeric ABV and omits absent optional fields", () => {
    const beer = toBeer(
      beerRow.parse({
        slug: "helles",
        name: "Bajor Helles",
        style: "Helles Lager",
        brewery: "Bajor Házi Főzde",
        abv: "4.9",
        serve: "csapolt",
        sizes: [{ label: "0,5 l", price: 1290 }],
        image: null,
        is_house: false,
      }),
    );
    expect(beer.abv).toBe(4.9);
    expect(beer).not.toHaveProperty("house");
    expect(beer).not.toHaveProperty("image");
  });
});

describe("toGalleryItems", () => {
  it("skips rows whose image cannot be resolved", () => {
    const items = toGalleryItems([
      { id: "1", url: "placeTap", alt: "Csap", category: "Sörök", is_tall: true },
      { id: "2", url: "missing", alt: "?", category: "Hely", is_tall: false },
    ]);
    expect(items).toEqual([
      { id: "1", src: images.placeTap, alt: "Csap", category: "Sörök", tall: true },
    ]);
  });
});
