import {
  isBookingErrorCode,
  type ReservationInput,
  type ReservationResult,
  type Slot,
} from "@/features/booking/schema";
import { onReservationCreated, type NewReservation } from "./notifications";
import { createRateLimiter } from "./rate-limit";
import { getSupabase } from "./supabase";

/** Live availability (not cached): slots of a date and whether the party still fits. */
export async function getAvailableSlots(date: string, partySize: number): Promise<Slot[]> {
  const { data, error } = await getSupabase().rpc("available_slots", {
    p_date: date,
    p_party_size: partySize,
  });
  if (error) throw error;
  return (data as { slot_time: string; available: boolean }[]).map((s) => ({
    time: s.slot_time.slice(0, 5),
    available: s.available,
  }));
}

const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

/**
 * Stores a reservation. The database trigger enforces the booking rules and answers with an
 * error code when one fails. Honeypot hits get a fake success so bots learn nothing.
 */
export async function submitReservation(
  input: ReservationInput,
  clientIp: string,
): Promise<ReservationResult> {
  if (!limiter.attempt(clientIp)) return { ok: false, error: "rate_limited" };
  if (input.website) {
    console.warn(`Booking honeypot triggered from ${clientIp}; ignored`);
    return { ok: true };
  }

  const reservation: NewReservation = {
    date: input.date,
    time: input.time,
    partySize: input.partySize,
    name: input.name,
    phone: input.phone,
    email: input.email,
    note: input.note,
  };
  const { error } = await getSupabase()
    .from("reservations")
    .insert({
      date: reservation.date,
      time: reservation.time,
      party_size: reservation.partySize,
      name: reservation.name,
      phone: reservation.phone,
      email: reservation.email,
      note: reservation.note || null,
      // Asserts consent; the database replaces it with its own timestamp.
      consent_at: new Date().toISOString(),
    });

  if (error) {
    if (error.code === "P0001" && isBookingErrorCode(error.message)) {
      return { ok: false, error: error.message };
    }
    console.error("Reservation insert failed:", error);
    return { ok: false, error: "unknown" };
  }

  onReservationCreated(reservation).catch((err: unknown) =>
    console.error("onReservationCreated failed:", err),
  );
  return { ok: true };
}
