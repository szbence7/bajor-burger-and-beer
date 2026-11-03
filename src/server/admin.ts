// Admin actions. Each runs as the signed-in admin (their access token), so Row Level Security
// decides: only two-factor (aal2) admins can change anything. Content changes clear the
// public content cache so the site shows them at once.
import {
  NOTIFICATION_KINDS,
  SOCIAL_NETWORKS,
  type SiteDetailsInput,
  isReservationKind,
  type AdminErrorCode,
  type AdminResult,
  type DecisionOutcome,
  type MenuPdfInput,
  type SetStatusInput,
  type SpecialInput,
  type TapInput,
} from "@/features/admin/schema";
import { z } from "zod";
import { groupDayHours } from "@/lib/opening-hours";
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

export const fail = (error: AdminErrorCode) => ({ ok: false, error }) as const;

/** Maps PostgREST errors: expired tokens and RLS denials have their own messages. */
export function failFrom(error: { code?: string; message?: string }, action: string) {
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
  if (!row?.reservations || !isReservationKind(row.kind)) return fail("forbidden");
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

/** Saves the order of a sortable content table's rows (the ids in their new order). */
async function reorderRows(
  token: string,
  table: "monthly_specials" | "taps",
  ids: string[],
): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const results = await Promise.all(
    ids.map((id, i) =>
      db
        .from(table)
        .update({ sort_order: i + 1 })
        .eq("id", id)
        .select("id"),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return failFrom(failed.error, `${table} reorder`);
  if (results.some((r) => !r.data?.length)) return fail("forbidden");
  clearCache();
  return { ok: true, data: null };
}

export const reorderSpecials = (token: string, ids: string[]) =>
  reorderRows(token, "monthly_specials", ids);

export async function saveTap(token: string, input: TapInput): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const values = { name: input.name, logo: input.logo, is_active: input.isActive };
  let result;
  let previousLogo: string | null = null;
  if (input.id) {
    const before = await db.from("taps").select("logo").eq("id", input.id).maybeSingle();
    previousLogo = (before.data as { logo: string } | null)?.logo ?? null;
    result = await db.from("taps").update(values).eq("id", input.id).select("id");
  } else {
    // New taps go to the end of the row.
    const { data: last } = await db
      .from("taps")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((last as { sort_order: number } | null)?.sort_order ?? 0) + 1;
    result = await db
      .from("taps")
      .insert({ ...values, sort_order: sortOrder })
      .select("id");
  }
  if (result.error) return failFrom(result.error, "tap save");
  if (!result.data?.length) return fail("forbidden");
  clearCache();
  if (previousLogo && previousLogo !== input.logo) await removeMedia(db, previousLogo);
  return { ok: true, data: null };
}

export async function deleteTap(token: string, id: string): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const { data, error } = await db.from("taps").delete().eq("id", id).select("logo");
  if (error) return failFrom(error, "tap delete");
  if (!data?.length) return fail("forbidden");
  clearCache();
  await removeMedia(db, (data[0] as { logo: string }).logo);
  return { ok: true, data: null };
}

export const reorderTaps = (token: string, ids: string[]) => reorderRows(token, "taps", ids);

/**
 * Points the site at a newly uploaded menu PDF and its page images (or removes the menu) and
 * deletes the previous files.
 */
export async function setMenuPdf(
  token: string,
  { path, pages }: MenuPdfInput,
): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const current = await db
    .from("site_settings")
    .select("menu_pdf_path, menu_pdf_pages")
    .maybeSingle();
  if (current.error) return failFrom(current.error, "menu PDF read");
  const previous = previousMenuRow.safeParse(current.data ?? {});

  const { data, error } = await db
    .from("site_settings")
    .update({
      menu_pdf_path: path,
      menu_pdf_pages: pages,
      menu_pdf_updated_at: path ? new Date().toISOString() : null,
    })
    .eq("id", true)
    .select("id");
  if (error) return failFrom(error, "menu PDF update");
  if (!data?.length) return fail("forbidden");
  clearCache();

  if (previous.success) {
    const keep = new Set([path, ...pages.flatMap((p) => [p.file, p.small])]);
    const { menu_pdf_path: oldPath, menu_pdf_pages: oldPages } = previous.data;
    const stale = [oldPath, ...oldPages.flatMap((p) => [p.file, p.small])].filter(
      (name): name is string => !!name && !keep.has(name),
    );
    if (stale.length) {
      const removed = await db.storage.from("menu").remove(stale);
      if (removed.error) console.warn("Old menu files not deleted:", stale, removed.error);
    }
  }
  return { ok: true, data: null };
}

const previousMenuRow = z.object({
  menu_pdf_path: z.string().nullable(),
  menu_pdf_pages: z.array(z.object({ file: z.string(), small: z.string() })),
});

/** Adatok: contact, company, socials, opening hours and booking rules in one save. */
export async function saveSiteDetails(
  token: string,
  input: SiteDetailsInput,
): Promise<AdminResult> {
  const db = getUserSupabase(token);
  const { data, error } = await db
    .from("site_settings")
    .update({
      restaurant_name: input.restaurantName,
      phone: input.phone,
      email: input.email,
      street: input.street,
      postal_code: input.postalCode,
      city: input.city,
      company_name: input.companyName,
      company_address: input.companyAddress,
      tax_number: input.taxNumber,
      company_reg_number: input.regNumber,
      socials: SOCIAL_NETWORKS.filter((n) => input.socials[n]).map((label) => ({
        label,
        href: input.socials[label],
      })),
      booking_capacity: input.booking.capacity,
      booking_max_party_size: input.booking.maxPartySize,
      booking_duration_minutes: input.booking.durationMinutes,
      booking_slot_minutes: input.booking.slotMinutes,
      booking_days_ahead: input.booking.daysAhead,
      booking_min_notice_minutes: input.booking.minNoticeMinutes,
      booking_hold_minutes: input.booking.holdMinutes,
    })
    .eq("id", true)
    .select("id");
  if (error) return failFrom(error, "site details save");
  if (!data?.length) return fail("forbidden");

  const hours = await db.rpc("replace_opening_hours", { p_rows: groupDayHours(input.hours) });
  if (hours.error) return failFrom(hours.error, "opening hours save");
  clearCache();
  return { ok: true, data: null };
}
