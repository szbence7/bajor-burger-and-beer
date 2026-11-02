import { describe, expect, it } from "vitest";
import { mediaPathOf } from "./admin";

describe("mediaPathOf", () => {
  it("extracts the object path of images uploaded to the media bucket only", () => {
    expect(
      mediaPathOf("https://db.example.hu/storage/v1/object/public/media/specials/a%20b.webp"),
    ).toBe("specials/a b.webp");
    expect(
      mediaPathOf("https://db.example.hu/storage/v1/object/public/menu/x.pdf"),
    ).toBeUndefined();
    expect(mediaPathOf("burgerHero")).toBeUndefined();
    expect(mediaPathOf(null)).toBeUndefined();
  });
});
