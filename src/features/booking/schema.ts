// Booking input validation, shared by the form (field errors) and the server function.
// Business rules (opening hours, capacity, notice, party limit) are enforced in Postgres.
import { z } from "zod";

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Válassz dátumot.");

export const availabilityInput = z.object({
  date: isoDate,
  partySize: z.number().int().min(1).max(100),
});
export type AvailabilityInput = z.infer<typeof availabilityInput>;

export interface Slot {
  /** "HH:MM" */
  time: string;
  available: boolean;
}

export const reservationInput = z.object({
  date: isoDate,
  time: z.string().regex(/^\d{2}:\d{2}$/, "Válassz időpontot."),
  partySize: z.number().int().min(1).max(100),
  name: z.string().trim().min(2, "Add meg a neved.").max(100, "Legfeljebb 100 karakter."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 ()/-]{5,24}$/, "Adj meg egy érvényes telefonszámot."),
  email: z
    .string()
    .trim()
    .email("Adj meg egy érvényes e-mail-címet.")
    .max(254, "Túl hosszú e-mail-cím."),
  note: z.string().trim().max(1000, "Legfeljebb 1000 karakter."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "A foglaláshoz el kell fogadnod az adatkezelési tájékoztatót." }),
  }),
  /** Honeypot: hidden from people, so anything typed here comes from a bot. */
  website: z.string().max(500),
});
export type ReservationInput = z.infer<typeof reservationInput>;

/** Error codes raised by the database trigger, plus the app's own. */
export const BOOKING_ERRORS = {
  slot_full: "Ez az időpont közben betelt. Kérjük, válassz másikat.",
  invalid_slot: "Ez az időpont nem foglalható. Kérjük, válassz másikat.",
  too_late: "Erre az időpontra már nem lehet online foglalni. Kérjük, válassz későbbit.",
  date_out_of_range: "Erre a napra nem lehet online foglalni.",
  party_too_large: "Ekkora társaságnak kérjük, telefonon foglalj.",
  consent_required: "A foglaláshoz el kell fogadnod az adatkezelési tájékoztatót.",
  booking_unavailable: "Az online foglalás most nem elérhető. Kérjük, hívj minket.",
  rate_limited: "Túl sok foglalási kísérlet érkezett. Próbáld újra később, vagy hívj minket.",
  unknown: "Valami hiba történt. Kérjük, próbáld újra, vagy hívj minket.",
} as const;
export type BookingErrorCode = keyof typeof BOOKING_ERRORS;

/** Codes that mean "pick another time": the form sends the guest back to the slots. */
export const SLOT_ERRORS: readonly BookingErrorCode[] = [
  "slot_full",
  "invalid_slot",
  "too_late",
  "date_out_of_range",
];

export const isBookingErrorCode = (code: string): code is BookingErrorCode =>
  Object.hasOwn(BOOKING_ERRORS, code);

export type ReservationResult = { ok: true } | { ok: false; error: BookingErrorCode };
