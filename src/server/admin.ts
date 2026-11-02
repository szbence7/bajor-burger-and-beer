// Admin actions. Each runs as the signed-in admin (their access token), so Row Level Security
// decides: only two-factor (aal2) admins can change anything. Content changes clear the
// public content cache so the site shows them at once.
import {
  NOTIFICATION_KINDS,
  type AdminErrorCode,
  type AdminResult,
  type DecisionOutcome,
  type SetStatusInput,
  type SpecialInput,
} from "@/features/admin/schema";
import { z } from "zod";
import { clearCache } from "./cache";
import { deliver, onReservationDecided, type ReservationDetails } from "./notifications";
import { getUserSupabase } from "./supabase";

const RESERVATION_COLUMNS = "id, date, time, party_size, name, phone, email, note, decision_note";

const reservationDetailsRow = z
  .object({
    id: z.string(),
    date: z.string(),
    time: z.string(),
    party_size: z.number().int(),
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    note: z.string().nullable(),
    decision_note: z.string().nullable(),
  })
  .transform((r): ReservationDetails => ({
    id: r.id,
    date: r.date,
    time: r.time.slice(0, 5),
    partySize: r.party_size,
    name: r.name,
    phone: r.phone,
    email: r.email,
    note: r.note ?? "",
    ...(r.decision_note && { decisionNote: r.decision_note }),
  }));

const fail = (error: AdminErrorCode) => ({ ok: false, error }) as const;

/** Maps PostgREST errors: expired tokens and RLS denials have their own messages. */
function failFrom(error: { code?: string; message?: string }, action: string) {
  if (error.code === "PGRST301" || error.code === "PGRST303") return fail("unauthorized");
  if (error.code === "42501") return fail("forbidden");
  console.error(`Admin ${action} failed:`, error);
  return fail("unknown");
}

export async function setReservationStatus(
  token: string,
  input: SetStatusInput,
): Promise<AdminResult<DecisionOutcome>> {
  const { data, error } = await getUserSupabase(token)
    .from("reservations")
    .update({ status: input.status, decision_note: input.message || null })
    .eq("id", input.id)
    .select(RESERVATION_COLUMNS)
    .maybeSingle();
  if (error) return failFrom(error, "status change");
  // RLS hides the row from anyone but a two-factor admin, so nothing was updated.
  if (!data) return fail("forbidden");
  const email = await onReservationDecided(reservationDetailsRow.parse(data), input.status);
  return { ok: true, data: { email } };
}

/** Sends a logged notification again (e.g. after fixing the SMTP settings). */
export async function resendNotification(
  token: string,
  logId: string,
): Promise<AdminResult<DecisionOutcome>> {
  const { data, error } = await getUserSupabase(token)
    .from("notification_log")
    .select(`kind, reservations (${RESERVATION_COLUMNS})`)
    .eq("id", logId)
    .maybeSingle();
  if (error) return failFrom(error, "resend");
  const row = z
    .object({ kind: z.enum(NOTIFICATION_KINDS), reservations: reservationDetailsRow.nullable() })
    .nullable()
    .parse(data);
  if (!row?.reservations) return fail("forbidden");
  return { ok: true, data: { email: await deliver(row.kind, row.reservations) } };
}

/** Object path of an image uploaded to the "media" bucket, from its public URL. */
export function mediaPathOf(url: string | null | undefined): string | undefined {
  const match = url?.match(/\/storage\/v1\/object\/public\/media\/([^?#]+)$/);
  return match?.[1] && decodeURIComponent(match[1]);
}

/** Best effort: an orphaned image only wastes space. */
async function removeMedia(db: ReturnType<typeof getUserSupabase>, url: string | null | undefined) {
  const path = mediaPathOf(url);
  if (!path) return;
  const { error } = await db.storage.from("media").remove([path]);
  if (error) console.warn(`Unused image ${path} not deleted:`, error);
}

export async function saveSpecial(token: string, input: SpecialInput): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const values = {
    name: input.name,
    description: input.description,
    price: input.price,
    image: input.image,
    is_active: input.isActive,
  };
  let result;
  let previousImage: string | null = null;
  if (input.id) {
    const before = await db
      .from("monthly_specials")
      .select("image")
      .eq("id", input.id)
      .maybeSingle();
    previousImage = (before.data as { image: string | null } | null)?.image ?? null;
    result = await db.from("monthly_specials").update(values).eq("id", input.id).select("id");
  } else {
    // New cards go to the end.
    const { data: last } = await db
      .from("monthly_specials")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((last as { sort_order: number } | null)?.sort_order ?? 0) + 1;
    result = await db
      .from("monthly_specials")
      .insert({ ...values, sort_order: sortOrder })
      .select("id");
  }
  if (result.error) return failFrom(result.error, "special save");
  if (!result.data?.length) return fail("forbidden");
  clearCache();
  if (previousImage !== input.image) await removeMedia(db, previousImage);
  return { ok: true, data: null };
}

export async function deleteSpecial(token: string, id: string): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const { data, error } = await db.from("monthly_specials").delete().eq("id", id).select("image");
  if (error) return failFrom(error, "special delete");
  if (!data?.length) return fail("forbidden");
  clearCache();
  await removeMedia(db, (data[0] as { image: string | null }).image);
  return { ok: true, data: null };
}

export async function reorderSpecials(token: string, ids: string[]): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const results = await Promise.all(
    ids.map((id, i) =>
      db
        .from("monthly_specials")
        .update({ sort_order: i + 1 })
        .eq("id", id)
        .select("id"),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return failFrom(failed.error, "special reorder");
  if (results.some((r) => !r.data?.length)) return fail("forbidden");
  clearCache();
  return { ok: true, data: null };
}

/** Points the site at a newly uploaded menu PDF (or removes it) and deletes the old file. */
export async function setMenuPdf(token: string, path: string | null): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const current = await db.from("site_settings").select("menu_pdf_path").maybeSingle();
  if (current.error) return failFrom(current.error, "menu PDF read");
  const previous = (current.data as { menu_pdf_path: string | null } | null)?.menu_pdf_path;

  const { data, error } = await db
    .from("site_settings")
    .update({ menu_pdf_path: path, menu_pdf_updated_at: path ? new Date().toISOString() : null })
    .eq("id", true)
    .select("id");
  if (error) return failFrom(error, "menu PDF update");
  if (!data?.length) return fail("forbidden");
  clearCache();

  if (previous && previous !== path) {
    const removed = await db.storage.from("menu").remove([previous]);
    if (removed.error) console.warn(`Old menu PDF ${previous} not deleted:`, removed.error);
  }
  return { ok: true, data: null };
}
