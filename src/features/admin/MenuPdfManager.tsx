import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Upload } from "lucide-react";
import {
  MENU_LANGUAGES,
  MENU_LANGUAGE_LABELS,
  menuBookInput,
  menuBookRow,
  type MenuBookRow,
  type MenuLanguage,
  type MenuVersionRow,
} from "@/lib/menu-schema";
import { saveMenuBookFn, saveMenuVersionFn, deleteMenuBookFn, deleteMenuVersionFn } from "./api";
import { prepareMenuFiles, validateMenuFiles } from "./menu-upload";
import { MenuPdfError } from "./pdf-pages";
import { ADMIN_ERRORS, MENU_MAX_PAGES, type AdminResult } from "./schema";
import { adminSupabase } from "./supabase";
import { Button, Card, PageTitle, inputClass, labelClass, formatTimestamp, useToast } from "./ui";

const QUERY_KEY = ["admin", "menu-books"];
const imageUrl = (name: string) =>
  name.startsWith("/menus/")
    ? name
    : adminSupabase().storage.from("menu").getPublicUrl(name).data.publicUrl;

export function MenuPdfManager() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await adminSupabase()
        .from("menu_books")
        .select("*, menu_versions(*)")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return z.array(menuBookRow).parse(data);
    },
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };
  const mutate = async (action: () => Promise<AdminResult>, message: string) => {
    setBusy(true);
    try {
      const result = await action();
      toast(result.ok ? message : ADMIN_ERRORS[result.error], result.ok ? "info" : "warning");
      return result.ok;
    } catch {
      toast(ADMIN_ERRORS.unknown, "warning");
      return false;
    } finally {
      setBusy(false);
      refresh();
    }
  };

  return (
    <>
      <PageTitle>Étlapok</PageTitle>
      <p className="mb-6 max-w-3xl text-muted-foreground">
        Hozz létre étlapokat, és töltsd fel a magyar és az angol változatot külön-külön. A
        nyelvválasztó csak akkor jelenik meg, ha mindkét változat elérhető. Lapozni csak a
        kiválasztott nyelv többoldalas étlapját lehet.
      </p>
      <Card className="mb-6">
        <h2 className="mb-4 font-display text-2xl">Új étlap</h2>
        <MenuDetailsForm
          busy={busy}
          onSave={(title, description) =>
            mutate(
              () => saveMenuBookFn({ data: { id: null, title, description } }),
              "Az étlap létrejött. Most feltöltheted a nyelvi változatokat.",
            )
          }
        />
      </Card>
      {query.isPending ? (
        <p>Betöltés…</p>
      ) : query.isError ? (
        <Card>
          <p>Nem sikerült betölteni az étlapokat.</p>
          <Button className="mt-3" onClick={() => void query.refetch()}>
            Újrapróbálás
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {query.data.length === 0 && <p>Még nincs létrehozott étlap.</p>}
          {query.data.map((book) => (
            <MenuEditor
              key={book.id}
              book={book}
              busy={busy}
              setBusy={setBusy}
              refresh={refresh}
              mutate={mutate}
            />
          ))}
        </div>
      )}
    </>
  );
}

function MenuDetailsForm({
  book,
  busy,
  onSave,
}: {
  book?: MenuBookRow;
  busy: boolean;
  onSave: (title: string, description: string) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const toast = useToast();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = menuBookInput.safeParse({ id: book?.id ?? null, title, description });
    if (!result.success) {
      toast(result.error.issues[0]?.message ?? "Ellenőrizd az adatokat.", "warning");
      return;
    }
    if ((await onSave(result.data.title, result.data.description)) && !book) {
      setTitle("");
      setDescription("");
    }
  };
  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <label className={labelClass}>
        Étlap neve
        <input
          required
          maxLength={80}
          className={`${inputClass} mt-2`}
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className={labelClass}>
        Leírás
        <textarea
          maxLength={300}
          className={`${inputClass} mt-2`}
          value={description}
          disabled={busy}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={busy}>
        {!book && <Plus className="h-4 w-4" />}
        {book ? "Adatok mentése" : "Étlap létrehozása"}
      </Button>
    </form>
  );
}

type Mutate = (action: () => Promise<AdminResult>, message: string) => Promise<boolean>;
function MenuEditor({
  book,
  busy,
  setBusy,
  refresh,
  mutate,
}: {
  book: MenuBookRow;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  refresh: () => void;
  mutate: Mutate;
}) {
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl">{book.title}</h2>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Törlöd a(z) „${book.title}” étlapot és mindkét nyelvi változatát?`))
              void mutate(() => deleteMenuBookFn({ data: { id: book.id } }), "Az étlap törölve.");
          }}
        >
          Étlap törlése
        </Button>
      </div>
      <details className="mb-6">
        <summary className="mb-4 cursor-pointer font-bold text-primary">
          Név és leírás szerkesztése
        </summary>
        <MenuDetailsForm
          book={book}
          busy={busy}
          onSave={(title, description) =>
            mutate(
              () => saveMenuBookFn({ data: { id: book.id, title, description } }),
              "Az étlap adatai mentve.",
            )
          }
        />
      </details>
      {!book.menu_versions.length && (
        <p className="mb-4 text-muted-foreground">
          A weboldalon az első nyelvi változat feltöltése után jelenik meg.
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {MENU_LANGUAGES.map((language) => (
          <LanguageUpload
            key={language}
            book={book}
            language={language}
            version={book.menu_versions.find((v) => v.language === language)}
            busy={busy}
            setBusy={setBusy}
            refresh={refresh}
            mutate={mutate}
          />
        ))}
      </div>
    </Card>
  );
}

function LanguageUpload({
  book,
  language,
  version,
  busy,
  setBusy,
  refresh,
  mutate,
}: {
  book: MenuBookRow;
  language: MenuLanguage;
  version: MenuVersionRow | undefined;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  refresh: () => void;
  mutate: Mutate;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const [inputKey, setInputKey] = useState(0);
  const toast = useToast();
  const upload = async () => {
    const error = validateMenuFiles(files);
    if (error) {
      toast(error, "warning");
      return;
    }
    setBusy(true);
    setProgress("Előkészítés…");
    const storage = adminSupabase().storage.from("menu");
    const uploaded: string[] = [];
    let committed = false;
    let safeToRemove = true;
    try {
      const prepared = await prepareMenuFiles(files, (done, total) =>
        setProgress(`Oldalak előkészítése: ${done} / ${total}`),
      );
      const stem = `menu-${crypto.randomUUID()}`;
      const put = async (name: string, body: Blob, contentType: string) => {
        const { error } = await storage.upload(name, body, {
          contentType,
          cacheControl: "31536000",
        });
        if (error) throw error;
        uploaded.push(name);
      };
      const pages = [];
      for (const [i, page] of prepared.pages.entries()) {
        setProgress(`Feltöltés: ${i + 1} / ${prepared.pages.length}`);
        const file = `${stem}-${i + 1}.webp`,
          small = `${stem}-${i + 1}-sm.webp`;
        await put(file, page.large, "image/webp");
        await put(small, page.small, "image/webp");
        pages.push({ file, small, width: page.width, height: page.height, text: page.text });
      }
      const pdfPath = prepared.pdf ? `${stem}.pdf` : null;
      if (prepared.pdf && pdfPath) await put(pdfPath, prepared.pdf, "application/pdf");
      // If the response is lost, the server may already have saved these files.
      safeToRemove = false;
      const result = await saveMenuVersionFn({
        data: { menuId: book.id, language, pdfPath, pages },
      });
      if (!result.ok) {
        safeToRemove = true;
        toast(ADMIN_ERRORS[result.error], "warning");
        return;
      }
      committed = true;
      setFiles([]);
      setInputKey((key) => key + 1);
      toast(`A(z) ${MENU_LANGUAGE_LABELS[language]} változat feltöltve.`);
    } catch (error) {
      toast(
        error instanceof MenuPdfError
          ? error.reason === "too_many_pages"
            ? `Legfeljebb ${MENU_MAX_PAGES} oldal tölthető fel.`
            : "A PDF sérült vagy jelszóval védett."
          : "A feltöltés nem sikerült. Próbáld újra.",
        "warning",
      );
    } finally {
      if (!committed && safeToRemove && uploaded.length) {
        try {
          await storage.remove(uploaded);
        } catch {
          /* Unreferenced files can be cleaned later. */
        }
      }
      setBusy(false);
      setProgress("");
      refresh();
    }
  };
  return (
    <div className="min-w-0 rounded-2xl border border-border p-4">
      <h3 className="mb-3 font-display text-2xl">{MENU_LANGUAGE_LABELS[language]}</h3>
      {version ? (
        <>
          <p className="text-sm text-muted-foreground">
            {version.pages.length} oldal · {formatTimestamp(version.updated_at)}
          </p>
          <ul
            className="my-4 flex gap-3 overflow-x-auto pb-2"
            aria-label={`${book.title} · ${MENU_LANGUAGE_LABELS[language]} oldalak`}
          >
            {version.pages.map((page, i) => (
              <li key={page.file} className="shrink-0">
                <a href={imageUrl(page.file)} target="_blank" rel="noopener">
                  <img
                    src={imageUrl(page.small)}
                    alt={`${i + 1}. oldal megnyitása`}
                    width={page.width}
                    height={page.height}
                    className="h-40 w-auto rounded-lg bg-white"
                    loading="lazy"
                  />
                </a>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            disabled={busy}
            className="mb-4"
            onClick={() => {
              if (
                window.confirm(
                  `Leveszed a(z) „${book.title}” ${MENU_LANGUAGE_LABELS[language]} változatát? A másik nyelv megmarad.`,
                )
              )
                void mutate(
                  () => deleteMenuVersionFn({ data: { menuId: book.id, language } }),
                  "A nyelvi változat eltávolítva.",
                );
            }}
          >
            Nyelvi változat levétele
          </Button>
        </>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          Még nincs feltöltött változat ezen a nyelven.
        </p>
      )}
      <label className={labelClass}>
        {version ? "Változat cseréje" : "Változat feltöltése"}
        <input
          key={inputKey}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
          disabled={busy}
          className="mt-2 block w-full text-sm"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      <p className="mb-3 text-sm text-muted-foreground">
        Egy PDF vagy több JPG, PNG, WebP kép. Max. 15 MB/fájl, {MENU_MAX_PAGES} oldal. Több kép
        esetén feltöltés előtt állítsd be a sorrendet.
      </p>
      {files.length > 1 && (
        <ol className="mb-4 space-y-2">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 break-all">
                {i + 1}. {file.name}
              </span>
              {([-1, 1] as const).map((direction) => (
                <button
                  key={direction}
                  type="button"
                  disabled={busy || i + direction < 0 || i + direction >= files.length}
                  className="min-h-11 min-w-11 rounded border border-border disabled:opacity-30"
                  aria-label={`${file.name} ${direction === -1 ? "előrébb" : "hátrébb"}`}
                  onClick={() =>
                    setFiles((current) => {
                      const next = [...current];
                      [next[i], next[i + direction]] = [next[i + direction]!, next[i]!];
                      return next;
                    })
                  }
                >
                  {direction === -1 ? "↑" : "↓"}
                </button>
              ))}
            </li>
          ))}
        </ol>
      )}
      <Button disabled={busy || !files.length} onClick={() => void upload()}>
        <Upload className="h-4 w-4" />
        {progress || (version ? "Csere feltöltése" : "Feltöltés")}
      </Button>
      <p role="status" className="sr-only">
        {progress}
      </p>
    </div>
  );
}
