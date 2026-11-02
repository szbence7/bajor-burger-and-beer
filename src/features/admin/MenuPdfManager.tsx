import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Upload } from "lucide-react";
import { z } from "zod";
import { absoluteUrl } from "@/lib/site";
import { menuPageRow, type MenuPageRow } from "@/lib/site-rows";
import { setMenuPdfFn } from "./api";
import { MenuPdfError, renderPdfPages } from "./pdf-pages";
import { ADMIN_ERRORS, MENU_MAX_PAGES, MENU_PDF_MAX_BYTES } from "./schema";
import { adminSupabase } from "./supabase";
import { useSmoothList } from "@/lib/motion";
import { Button, Card, PageTitle, formatTimestamp, useToast } from "./ui";

const QUERY_KEY = ["admin", "menu-pdf"];
const PUBLIC_PATH = "/etlap.pdf";

const pageUrl = (name: string) =>
  adminSupabase().storage.from("menu").getPublicUrl(name).data.publicUrl;

function useMenuPdf() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await adminSupabase()
        .from("site_settings")
        .select("menu_pdf_path, menu_pdf_updated_at, menu_pdf_pages")
        .single();
      if (error) throw error;
      return z
        .object({
          menu_pdf_path: z.string().nullable(),
          menu_pdf_updated_at: z.string().nullable(),
          menu_pdf_pages: z.array(menuPageRow),
        })
        .parse(data);
    },
  });
}

export function MenuPdfManager() {
  // Loading → current file → replaced file ease instead of jumping.
  const stateRef = useSmoothList<HTMLDivElement>();
  const query = useMenuPdf();
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [progress, setProgress] = useState("");
  const current = query.data?.menu_pdf_path ? query.data : null;

  const upload = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast("Csak PDF fájlt tölthetsz fel.", "warning");
      return;
    }
    if (file.size > MENU_PDF_MAX_BYTES) {
      toast("A PDF túl nagy (max. 15 MB). Mentsd el kisebb méretben.", "warning");
      return;
    }
    setBusy("upload");
    // Unique names, so browsers and CDNs may cache the files for good.
    const stem = `etlap-${Date.now()}`;
    const path = `${stem}.pdf`;
    const storage = adminSupabase().storage.from("menu");
    const uploaded: string[] = [];
    const put = async (name: string, body: Blob, contentType: string, cacheControl: string) => {
      const { error } = await storage.upload(name, body, { contentType, cacheControl });
      if (error) throw error;
      uploaded.push(name);
    };
    try {
      // The site shows the pages as images: render them here, once, at upload time.
      const rendered = await renderPdfPages(file, (done, total) =>
        setProgress(`Oldalak előkészítése: ${done} / ${total}`),
      );
      setProgress("Feltöltés…");
      const pages: MenuPageRow[] = [];
      for (const [i, page] of rendered.entries()) {
        const name = `${stem}-${i + 1}`;
        await put(`${name}.webp`, page.large, "image/webp", "31536000");
        await put(`${name}-sm.webp`, page.small, "image/webp", "31536000");
        pages.push({
          file: `${name}.webp`,
          small: `${name}-sm.webp`,
          width: page.width,
          height: page.height,
          text: page.text,
        });
      }
      await put(path, file, "application/pdf", "60");
      const result = await setMenuPdfFn({ data: { path, pages } });
      if (!result.ok) {
        await storage.remove(uploaded);
        toast(ADMIN_ERRORS[result.error], "warning");
        return;
      }
      toast("Az új étlap kint van a weboldalon.");
    } catch (error) {
      if (uploaded.length) await storage.remove(uploaded);
      toast(
        error instanceof MenuPdfError
          ? error.reason === "too_many_pages"
            ? `Legfeljebb ${MENU_MAX_PAGES} oldalas étlapot tölthetsz fel.`
            : "Ezt a PDF-et nem sikerült megnyitni. Jelszavas vagy sérült?"
          : "A feltöltés nem sikerült. Próbáld újra.",
        "warning",
      );
    } finally {
      setBusy(null);
      setProgress("");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  };

  const remove = async () => {
    if (!window.confirm("Biztosan leveszed az étlapot a weboldalról?")) return;
    setBusy("remove");
    try {
      const result = await setMenuPdfFn({ data: { path: null, pages: [] } });
      toast(
        result.ok ? "Az étlap lekerült a weboldalról." : ADMIN_ERRORS[result.error],
        result.ok ? "info" : "warning",
      );
    } catch {
      toast(ADMIN_ERRORS.unknown, "warning");
    } finally {
      setBusy(null);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  };

  return (
    <>
      <PageTitle>Étlap PDF</PageTitle>
      <p className="mb-6 max-w-2xl text-muted-foreground">
        A főoldal Étlap része a legutóbb feltöltött PDF oldalait mutatja, lapozhatóan. A PDF
        letölthető linkje nem változik, QR-kódhoz is használhatod:{" "}
        <span className="font-bold text-foreground [overflow-wrap:anywhere]">
          {absoluteUrl(PUBLIC_PATH)}
        </span>
      </p>

      <Card className="mb-6">
        <div ref={stateRef}>
          {query.isPending ? (
            <p className="text-muted-foreground">Betöltés…</p>
          ) : query.isError ? (
            <p>Nem sikerült betölteni.</p>
          ) : current ? (
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <FileText className="h-12 w-12 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Jelenlegi étlap</p>
                  <p className="text-sm text-muted-foreground">
                    {current.menu_pdf_pages.length} oldal · Feltöltve:{" "}
                    {current.menu_pdf_updated_at && formatTimestamp(current.menu_pdf_updated_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={PUBLIC_PATH}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-border px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider hover:border-primary"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden /> Megnyitás
                  </a>
                  <Button variant="ghost" disabled={busy !== null} onClick={() => void remove()}>
                    {busy === "remove" ? "Levétel…" : "Levétel"}
                  </Button>
                </div>
              </div>
              <ul className="mt-5 flex gap-3 overflow-x-auto pb-1" aria-label="Oldalak">
                {current.menu_pdf_pages.map((page, i) => (
                  <li key={page.file} className="shrink-0">
                    <img
                      src={pageUrl(page.small)}
                      alt={`${i + 1}. oldal`}
                      width={page.width}
                      height={page.height}
                      loading="lazy"
                      className="h-40 w-auto rounded-lg border border-border bg-white"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Még nincs feltöltött étlap, a főoldalon nem látszik az Étlap rész.
            </p>
          )}
        </div>
      </Card>

      <input
        ref={fileRef}
        id="menu-pdf-file"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      <Button disabled={busy !== null} onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" aria-hidden />
        {busy === "upload"
          ? progress || "Feltöltés…"
          : current
            ? "Új étlap feltöltése (csere)"
            : "Étlap feltöltése"}
      </Button>
      <p className="mt-3 text-sm text-muted-foreground">
        PDF, legfeljebb 15 MB és {MENU_MAX_PAGES} oldal. A feltöltés oldalanként pár másodperc, ne
        zárd be közben az oldalt.
      </p>
    </>
  );
}
