import { IMAGE_MAX_BYTES } from "./schema";
import { adminSupabase } from "./supabase";

const MAX_SIDE = 1200;

/**
 * Shrinks a photo in the browser before upload (phone photos are 3–10 MB): longest side
 * 1200 px, WebP where the browser can encode it (keeps cut-out transparency), PNG otherwise.
 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("A képet nem sikerült feldolgozni.");
  return blob;
}

/** Uploads an image to the public "media" bucket and returns its public URL. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Ez nem képfájl.");
  const blob = await shrink(file);
  if (blob.size > IMAGE_MAX_BYTES) throw new Error("A kép túl nagy (max. 5 MB).");
  const ext = blob.type === "image/webp" ? "webp" : "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const storage = adminSupabase().storage.from("media");
  const { error } = await storage.upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error("A feltöltés nem sikerült. Próbáld újra.");
  return storage.getPublicUrl(path).data.publicUrl;
}

/** Deletes an image this panel uploaded (e.g. after a cancelled edit). Best effort. */
export async function removeUploadedImage(url: string) {
  const path = url.match(/\/storage\/v1\/object\/public\/media\/([^?#]+)$/)?.[1];
  if (path)
    await adminSupabase()
      .storage.from("media")
      .remove([decodeURIComponent(path)]);
}
