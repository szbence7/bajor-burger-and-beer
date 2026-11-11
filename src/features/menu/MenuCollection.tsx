import { useState } from "react";
import type { MenuBook } from "@/data/menus";
import { MENU_LANGUAGES, MENU_LANGUAGE_LABELS, type MenuLanguage } from "@/lib/menu-schema";
import { cn } from "@/lib/utils";
import { ctaClass } from "@/lib/cta";
import { MenuViewer } from "./MenuViewer";

export function MenuCollection({ books }: { books: MenuBook[] }) {
  const [selected, setSelected] = useState(books[0]?.id ?? "");
  const [preferredLanguage, setLanguage] = useState<MenuLanguage>("hu");
  const book = books.find((item) => item.id === selected) ?? books[0];
  if (!book) return null;
  const languages = MENU_LANGUAGES.filter((language) => (book.versions[language]?.length ?? 0) > 0);
  const language = languages.includes(preferredLanguage) ? preferredLanguage : languages[0];
  if (!language) return null;
  const pages = book.versions[language]!;

  return (
    <div>
      <div
        role="group"
        aria-label="Étlap kiválasztása"
        className="flex flex-wrap justify-center gap-3"
      >
        {books.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={book.id === item.id}
            aria-controls="selected-menu"
            onClick={() => setSelected(item.id)}
            className={cn(ctaClass(book.id === item.id ? "gold" : "outline"), "px-5 py-3")}
          >
            {item.title}
          </button>
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-2xl text-center text-muted-foreground" aria-live="polite">
        {book.description}
      </p>
      <div id="selected-menu">
        <MenuViewer key={`${book.id}-${language}`} pages={pages} title={book.title}>
          {languages.length === 2 && (
            <div
              role="group"
              aria-label="Étlap nyelve"
              className="flex flex-wrap justify-center gap-2"
            >
              {languages.map((item) => (
                <button
                  key={item}
                  type="button"
                  lang={item}
                  aria-pressed={language === item}
                  onClick={() => setLanguage(item)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                    language === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {MENU_LANGUAGE_LABELS[item]}
                </button>
              ))}
            </div>
          )}
        </MenuViewer>
      </div>
    </div>
  );
}
