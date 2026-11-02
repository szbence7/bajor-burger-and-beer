// Reservation emails. Every attempt is written to notification_log (sent / failed / skipped),
// so the staff can see in the admin panel whether a guest was actually notified.
import {
  DECISION_NOTIFICATION,
  type DecisionStatus,
  type NotificationKind,
  type NotificationStatus,
  type ReservationNotificationKind,
} from "@/features/admin/schema";
import { getSiteInfo } from "./content";
import { buildAccountEmail, buildEmail, type ReservationDetails } from "./email-templates";
import { sendMail } from "./mailer";
import { getServiceSupabase } from "./supabase";

export type { ReservationDetails };

/** Staff inbox for new-booking alerts: NOTIFY_STAFF_EMAIL, else the venue's public email. */
async function staffRecipient(): Promise<string> {
  return process.env["NOTIFY_STAFF_EMAIL"]?.trim() || (await getSiteInfo()).contact.email;
}

async function log(
  reservationId: string | null,
  kind: NotificationKind,
  recipient: string,
  status: NotificationStatus,
  error?: string,
) {
  const { error: dbError } = await getServiceSupabase()
    .from("notification_log")
    .insert({ reservation_id: reservationId, kind, recipient, status, error: error ?? null });
  if (dbError) console.error(`Could not log the ${kind} email of ${reservationId}:`, dbError);
}

/** Sends one notification and logs the outcome. Never throws. */
export async function deliver(
  kind: ReservationNotificationKind,
  reservation: ReservationDetails,
): Promise<NotificationStatus> {
  let recipient = reservation.email;
  try {
    if (kind === "staff_new") recipient = await staffRecipient();
    const mail = buildEmail(kind, reservation, await getSiteInfo(), recipient);
    const result = await sendMail(mail);
    await log(
      reservation.id,
      kind,
      recipient,
      result.status,
      "error" in result ? result.error : undefined,
    );
    return result.status;
  } catch (error) {
    console.error(`Notification ${kind} of ${reservation.id} failed:`, error);
    const message = error instanceof Error ? error.message : String(error);
    await log(reservation.id, kind, recipient, "failed", message).catch(() => {});
    return "failed";
  }
}

/**
 * Called after a booking is stored: a receipt to the guest and an alert to the staff.
 * Failures are logged and never fail the booking.
 */
export async function onReservationCreated(reservation: ReservationDetails): Promise<void> {
  await Promise.all([deliver("guest_received", reservation), deliver("staff_new", reservation)]);
}

/** Called after the staff accepted, rejected or cancelled a booking. */
export function onReservationDecided(
  reservation: ReservationDetails,
  status: DecisionStatus,
): Promise<NotificationStatus> {
  return deliver(DECISION_NOTIFICATION[status], reservation);
}

/** Emails a new or reset admin their temporary password; logged without the password. */
export async function deliverAccountEmail(
  kind: "admin_invite" | "admin_reset",
  to: string,
  temporaryPassword: string,
): Promise<NotificationStatus> {
  const result = await sendMail(buildAccountEmail(kind, to, temporaryPassword));
  await log(null, kind, to, result.status, "error" in result ? result.error : undefined);
  return result.status;
}
