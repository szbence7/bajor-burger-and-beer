import { renderPdfPages, type RenderedPage } from "./pdf-pages";
import { MENU_MAX_PAGES, MENU_PDF_MAX_BYTES } from "./schema";

export function validateMenuFiles(files: File[]): string | null {
  if (!files.length) return "Válassz fájlt.";
  if (files.length > MENU_MAX_PAGES) return `Legfeljebb ${MENU_MAX_PAGES} oldal tölthető fel.`;
  const pdf = files.filter((file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name));
  if (pdf.length && files.length !== 1)
    return "Egy PDF-et vagy több képet válassz; PDF és kép nem keverhető.";
  if (files.some((file) => file.size === 0 || file.size > MENU_PDF_MAX_BYTES))
    return "Minden fájl mérete 1 bájt és 15 MB között lehet.";
  if (
    !pdf.length &&
    files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))
  )
    return "PDF, JPG, PNG vagy WebP fájlt válassz.";
  return null;
}

function webp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob?.type === "image/webp" ? resolve(blob) : reject(new Error("WebP encoding failed")),
      "image/webp",
      0.9,
    ),
  );
}

export async function prepareMenuFiles(
  files: File[],
  progress: (done: number, total: number) => void,
): Promise<{ pages: RenderedPage[]; pdf: File | null }> {
  const validation = validateMenuFiles(files);
  if (validation) throw new Error(validation);
  const first = files[0]!;
  if (first.type === "application/pdf" || /\.pdf$/i.test(first.name)) {
    return { pages: await renderPdfPages(first, progress), pdf: first };
  }
  const pages: RenderedPage[] = [];
  for (const [i, file] of files.entries()) {
    progress(i, files.length);
    const bitmap = await createImageBitmap(file);
    try {
      const render = async (width: number) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = Math.round((bitmap.height * width) / bitmap.width);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return { blob: await webp(canvas), height: canvas.height };
      };
      // Keep both declared responsive widths consistent with PDF-rendered pages.
      const large = await render(1600);
      const small = await render(800);
      pages.push({
        large: large.blob,
        small: small.blob,
        width: 1600,
        height: large.height,
        text: "",
      });
    } finally {
      bitmap.close();
    }
  }
  progress(files.length, files.length);
  return { pages, pdf: null };
}
