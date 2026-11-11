import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MenuBook } from "@/data/menus";
import type { MenuPage } from "@/data/info";
import { MenuCollection } from "./MenuCollection";

// Keep the real viewer's single-page rendering and controls; don't start the flip library.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    disconnect() {}
  },
);
afterEach(cleanup);
const page = (name: string): MenuPage => ({
  src: `/menus/${name}.jpg`,
  srcSmall: `/menus/${name}.jpg`,
  width: 703,
  height: 994,
  text: name,
});
const books: MenuBook[] = [
  {
    id: "food",
    title: "Étlap",
    description: "",
    versions: { hu: [page("food-hu")], en: [page("food-en")] },
  },
  {
    id: "takeaway",
    title: "Elviteles",
    description: "",
    versions: { hu: [page("cover"), page("takeaway")] },
  },
  {
    id: "english-only",
    title: "English only",
    description: "",
    versions: { en: [page("english-only")] },
  },
];

describe("menu language selection", () => {
  it("switches independent language versions without pagination for single-page menus", () => {
    render(<MenuCollection books={books} />);
    expect(screen.getByRole("group", { name: "Étlap nyelve" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Étlap · 1. oldal" })).toHaveAttribute(
      "src",
      "/menus/food-hu.jpg",
    );
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("img", { name: "Étlap · 1. oldal" })).toHaveAttribute(
      "src",
      "/menus/food-en.jpg",
    );
    expect(screen.queryByRole("button", { name: "Előző oldal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Következő oldal" })).not.toBeInTheDocument();
  });
  it("shows pagination for a real multipage version and hides the language selector for one language", () => {
    render(<MenuCollection books={books} />);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    fireEvent.click(screen.getByRole("button", { name: "Elviteles" }));
    expect(screen.queryByRole("group", { name: "Étlap nyelve" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Következő oldal" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Elviteles · 1. oldal" })).toHaveAttribute(
      "src",
      "/menus/cover.jpg",
    );
    fireEvent.click(screen.getByRole("button", { name: "Étlap" }));
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Következő oldal" })).not.toBeInTheDocument();
  });
  it("supports English-only menus without showing a language selector", () => {
    render(<MenuCollection books={[books[2]!]} />);
    expect(screen.queryByRole("group", { name: "Étlap nyelve" })).not.toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/menus/english-only.jpg");
  });
  it("does not render when no published menus exist", () => {
    const { container } = render(<MenuCollection books={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
