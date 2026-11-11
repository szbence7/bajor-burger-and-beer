import { describe, expect, it } from "vitest";
import { validateMenuFiles } from "./menu-upload";

const file = (name: string, type: string) => new File(["content"], name, { type });
describe("menu upload validation", () => {
  it("accepts one PDF or an ordered set of menu images", () => {
    expect(validateMenuFiles([file("menu.pdf", "application/pdf")])).toBeNull();
    expect(
      validateMenuFiles([file("cover.jpg", "image/jpeg"), file("menu.png", "image/png")]),
    ).toBeNull();
  });
  it("rejects mixed PDFs and images and multiple PDFs", () => {
    expect(
      validateMenuFiles([file("menu.pdf", "application/pdf"), file("cover.jpg", "image/jpeg")]),
    ).toMatch(/nem keverhető/);
    expect(
      validateMenuFiles([file("hu.pdf", "application/pdf"), file("en.pdf", "application/pdf")]),
    ).toMatch(/Egy PDF/);
  });
  it("rejects empty, unsupported, oversized and overly long uploads", () => {
    expect(validateMenuFiles([])).not.toBeNull();
    expect(validateMenuFiles([new File([], "empty.jpg", { type: "image/jpeg" })])).not.toBeNull();
    expect(validateMenuFiles([file("menu.svg", "image/svg+xml")])).not.toBeNull();
    const oversized = file("large.pdf", "application/pdf");
    Object.defineProperty(oversized, "size", { value: 16 * 1024 * 1024 });
    expect(validateMenuFiles([oversized])).not.toBeNull();
    expect(
      validateMenuFiles(Array.from({ length: 41 }, () => file("page.jpg", "image/jpeg"))),
    ).not.toBeNull();
  });
});
