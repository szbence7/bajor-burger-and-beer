import { describe, expect, it } from "vitest";
import { menuBookRow, menuVersionInput } from "@/lib/menu-schema";
import { menuFiles, toMenuBook } from "./menus";

const page = {
  file: "/menus/etlap-hu.jpg",
  small: "/menus/etlap-hu.jpg",
  width: 703,
  height: 994,
  text: "Magyar",
};
const version = {
  id: "30000000-0000-4000-8000-000000000001",
  menu_id: "10000000-0000-4000-8000-000000000001",
  language: "hu" as const,
  pdf_path: null,
  pages: [page],
  updated_at: "2026-11-11T12:00:00Z",
};
describe("stored menu books", () => {
  it("maps languages to separate document page arrays and keeps bundled assets local", () => {
    const row = menuBookRow.parse({
      id: version.menu_id,
      title: "Étlap",
      description: "",
      sort_order: 0,
      menu_versions: [
        version,
        {
          ...version,
          id: "30000000-0000-4000-8000-000000000002",
          language: "en",
          pages: [{ ...page, file: "/menus/etlap-en.jpg" }],
        },
      ],
    });
    const book = toMenuBook(row);
    expect(book.versions.hu).toHaveLength(1);
    expect(book.versions.en).toHaveLength(1);
    expect(book.versions.hu?.[0]?.src).toBe("/menus/etlap-hu.jpg");
    expect(book.versions.en?.[0]?.language).toBe("en");
  });
  it("cleans Storage files without trying to delete bundled originals", () => {
    expect(
      menuFiles([
        version,
        { pdf_path: "menu-a.pdf", pages: [{ ...page, file: "a.webp", small: "a.webp" }] },
      ]),
    ).toEqual(["menu-a.pdf", "a.webp"]);
  });
  it("rejects empty uploads, unsupported languages and unsafe file paths", () => {
    const input = {
      menuId: version.menu_id,
      language: "hu",
      pdfPath: null,
      pages: [{ ...page, file: "a.webp", small: "a-sm.webp" }],
    };
    expect(menuVersionInput.safeParse(input).success).toBe(true);
    expect(menuVersionInput.safeParse({ ...input, language: "de" }).success).toBe(false);
    expect(menuVersionInput.safeParse({ ...input, pages: [] }).success).toBe(false);
    expect(
      menuVersionInput.safeParse({ ...input, pages: [{ ...page, file: "../a.webp" }] }).success,
    ).toBe(false);
  });
});
