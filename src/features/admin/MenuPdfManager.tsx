import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Upload } from "lucide-react";
import { z } from "zod";
import { absoluteUrl } from "@/lib/site";
import { setMenuPdfFn } from "./api";
import { ADMIN_ERRORS, MENU_PDF_MAX_BYTES } from "./schema";
import { adminSupabase } from "./supabase";
import { Button, Card, PageTitle, formatTimestamp, useToast } from "./ui";

const QUERY_KEY = ["admin", "menu-pdf"];
const PUBLIC_PATH = "/etlap.pdf";

function useMenuPdf() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await adminSupabase()
        .from("site_settings")
        .select("menu_pdf_path, menu_pdf_updated_at")
        .single();
      if (error) throw error;
      return z
        .object({
          menu_pdf_path: z.string().nullable(),
          menu_pdf_updated_at: z.string().nullable(),
        })
        .parse(data);
    },
  });
}

export function MenuPdfManager() {
  const query = useMenuPdf();
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
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
    const path = `etlap-${Date.now()}.pdf`;
    const storage = adminSupabase().storage.from("menu");
    try {
      const { error } = await storage.upload(path, file, {
        contentType: "application/pdf",
        cacheControl: "60",
      });
      if (error) throw error;
      const result = await setMenuPdfFn({ data: { path } });
      if (!result.ok) {
        await storage.remove([path]);
        toast(ADMIN_ERRORS[result.error], "warning");
        return;
      }
      toast("Az új étlap kint van a weboldalon.");
    } catch {
      toast("A feltöltés nem sikerült. Próbáld újra.", "warning");
    } finally {
      setBusy(null);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  };

  const remove = async () => {
    if (!window.confirm("Biztosan leveszed az étlapot a weboldalról?")) return;
    setBusy("remove");
    try {
      const result = await setMenuPdfFn({ data: { path: null } });
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
        A Menü oldalon az „Étlap PDF-ben” gomb mindig a legutóbb feltöltött fájlt nyitja meg. A link
        nem változik, QR-kódhoz is használhatod:{" "}
        <span className="font-bold text-foreground [overflow-wrap:anywhere]">
          {absoluteUrl(PUBLIC_PATH)}
        </span>
      </p>

      <Card className="mb-6">
        {query.isPending ? (
          <p className="text-muted-foreground">Betöltés…</p>
        ) : query.isError ? (
          <p>Nem sikerült betölteni.</p>
        ) : current ? (
          <div className="flex flex-wrap items-center gap-4">
            <FileText className="h-12 w-12 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Jelenlegi étlap</p>
              <p className="text-sm text-muted-foreground">
                Feltöltve:{" "}
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
        ) : (
          <p className="text-muted-foreground">
            Még nincs feltöltött étlap, a Menü oldalon nem látszik PDF gomb.
          </p>
        )}
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
          ? "Feltöltés…"
          : current
            ? "Új étlap feltöltése (csere)"
            : "Étlap feltöltése"}
      </Button>
      <p className="mt-3 text-sm text-muted-foreground">PDF, legfeljebb 15 MB.</p>
    </>
  );
}
