// Renders the menu PDF's pages to WebP in the admin's browser at upload time, so the public
// site shows plain images and visitors never download a PDF renderer. pdf.js loads only here.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { MENU_MAX_PAGES } from "./schema";

const LARGE_WIDTH = 1600;
const SMALL_WIDTH = 800;

export interface RenderedPage {
  large: Blob;
  small: Blob;
  width: number;
  height: number;
  text: string;
}

export class MenuPdfError extends Error {
  constructor(readonly reason: "unreadable" | "too_many_pages") {
    super(reason);
  }
}

function toWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob?.type === "image/webp" ? resolve(blob) : reject(new Error("No WebP encoder")),
      "image/webp",
      0.86,
    ),
  );
}

function scaled(source: HTMLCanvasElement, width: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round((source.height * width) / source.width);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Every page as a 1600 px and an 800 px wide WebP plus its text (for screen readers). */
export async function renderPdfPages(
  file: File,
  onProgress: (done: number, total: number) => void,
): Promise<RenderedPage[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let doc;
  try {
    doc = await task.promise;
  } catch {
    await task.destroy();
    throw new MenuPdfError("unreadable");
  }
  try {
    if (doc.numPages > MENU_MAX_PAGES) throw new MenuPdfError("too_many_pages");
    const pages: RenderedPage[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      onProgress(n - 1, doc.numPages);
      const page = await doc.getPage(n);
      const viewport = page.getViewport({
        scale: LARGE_WIDTH / page.getViewport({ scale: 1 }).width,
      });
      const canvas = document.createElement("canvas");
      canvas.width = LARGE_WIDTH;
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim()
        .slice(0, 20_000);
      pages.push({
        large: await toWebp(canvas),
        small: await toWebp(scaled(canvas, SMALL_WIDTH)),
        width: canvas.width,
        height: canvas.height,
        text,
      });
      page.cleanup();
    }
    onProgress(doc.numPages, doc.numPages);
    return pages;
  } finally {
    // Also stops the worker.
    await task.destroy();
  }
}
