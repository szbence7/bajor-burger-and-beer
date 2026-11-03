// Admin panel: statuses, labels and the inputs of the admin server functions. Shared by the
// browser (forms) and the server (validation).
import { z } from "zod";
import { menuPageRow } from "@/lib/site-rows";

export const RESERVATION_STATUSES = ["pending", "confirmed", "rejected", "cancelled"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Függőben",
  confirmed: "Elfogadva",
  rejected: "Elutasítva",
  cancelled: "Lemondva",
};

/** Decisions the staff can make from each status (a mistaken rejection can be undone). */
export const NEXT_STATUSES: Record<ReservationStatus, readonly DecisionStatus[]> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["cancelled"],
  rejected: ["confirmed"],
  cancelled: ["confirmed"],
};

export const DECISION_STATUSES = ["confirmed", "rejected", "cancelled"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_LABELS: Record<DecisionStatus, string> = {
  confirmed: "Elfogadom",
  rejected: "Elutasítom",
  cancelled: "Lemondom",
};

/** Accepting a booking that was already rejected or cancelled (undoing a decision). */
export const isReopening = (from: ReservationStatus, to: DecisionStatus) =>
  to === "confirmed" && (from === "rejected" || from === "cancelled");

export const decisionLabel = (from: ReservationStatus, to: DecisionStatus) =>
  isReopening(from, to) ? "Mégis elfogadom" : DECISION_LABELS[to];

export const NOTIFICATION_KINDS = [
  "guest_received",
  "staff_new",
  "guest_confirmed",
  "guest_rejected",
  "guest_cancelled",
  "admin_invite",
  "admin_reset",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Emails about a reservation (the rest are about admin accounts). */
export type ReservationNotificationKind = Exclude<NotificationKind, "admin_invite" | "admin_reset">;
export const isReservationKind = (k: NotificationKind): k is ReservationNotificationKind =>
  k !== "admin_invite" && k !== "admin_reset";

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  guest_received: "Vendégnek: foglalás beérkezett",
  staff_new: "Személyzetnek: új foglalás",
  guest_confirmed: "Vendégnek: elfogadva",
  guest_rejected: "Vendégnek: elutasítva",
  guest_cancelled: "Vendégnek: lemondva",
  admin_invite: "Admin meghívó",
  admin_reset: "Admin fiók visszaállítva",
};

/** The guest email that goes out with each decision. */
export const DECISION_NOTIFICATION: Record<DecisionStatus, ReservationNotificationKind> = {
  confirmed: "guest_confirmed",
  rejected: "guest_rejected",
  cancelled: "guest_cancelled",
};

export const NOTIFICATION_STATUSES = ["sent", "failed", "skipped"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  sent: "Elküldve",
  failed: "Sikertelen",
  skipped: "Nem ment ki",
};

// Rows as the admin panel reads them (RLS: two-factor admins only) -------------------------

export const notificationRow = z.object({
  id: z.string(),
  reservation_id: z.string().nullable(),
  kind: z.enum(NOTIFICATION_KINDS),
  recipient: z.string(),
  status: z.enum(NOTIFICATION_STATUSES),
  error: z.string().nullable(),
  created_at: z.string(),
});
export type NotificationRow = z.infer<typeof notificationRow>;

export const reservationRow = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string().transform((t) => t.slice(0, 5)),
  party_size: z.number().int(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  note: z.string().nullable(),
  status: z.enum(RESERVATION_STATUSES),
  decision_note: z.string().nullable(),
  created_at: z.string(),
  status_changed_at: z.string().nullable(),
  notification_log: z.array(notificationRow).default([]),
});
export type ReservationRow = z.infer<typeof reservationRow>;

export const specialRow = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().int(),
  image: z.string().nullable(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});
export type SpecialRow = z.infer<typeof specialRow>;

export const tapRow = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});
export type TapRow = z.infer<typeof tapRow>;

// Server function inputs ---------------------------------------------------------------------

const uuid = z.string().uuid();

export const setStatusInput = z.object({
  id: uuid,
  status: z.enum(DECISION_STATUSES),
  message: z.string().trim().max(500, "Legfeljebb 500 karakter."),
});
export type SetStatusInput = z.infer<typeof setStatusInput>;

export const specialInput = z.object({
  id: uuid.nullable(),
  name: z.string().trim().min(1, "Add meg a nevét.").max(40, "Legfeljebb 40 karakter."),
  description: z.string().trim().max(300, "Legfeljebb 300 karakter."),
  price: z
    .number({ invalid_type_error: "Add meg az árat." })
    .int("Egész forintot adj meg.")
    .min(0, "Az ár nem lehet negatív.")
    .max(1_000_000, "Túl magas ár."),
  /** A bundled image key or an absolute URL (Storage upload); null = default photo. */
  image: z.string().max(500).nullable(),
  isActive: z.boolean(),
});
export type SpecialInput = z.infer<typeof specialInput>;

export const tapInput = z.object({
  id: uuid.nullable(),
  name: z.string().trim().min(1, "Add meg a sör nevét.").max(60, "Legfeljebb 60 karakter."),
  /** Absolute URL of the uploaded logo. */
  logo: z.string().url("Tölts fel egy logót.").max(500),
  isActive: z.boolean(),
});
export type TapInput = z.infer<typeof tapInput>;

export const idInput = z.object({ id: uuid });
export const reorderInput = z.object({ ids: z.array(uuid).min(1).max(50) });

/** The site shows the menu as page images; longer PDFs are refused (also capped in SQL). */
export const MENU_MAX_PAGES = 40;

/** Object names in the "menu" bucket: the PDF and its rendered pages; null removes the menu. */
export const menuPdfInput = z
  .object({
    path: z
      .string()
      .regex(/^[A-Za-z0-9._-]+\.pdf$/)
      .nullable(),
    pages: z.array(menuPageRow).max(MENU_MAX_PAGES),
  })
  .refine((v) => (v.path ? v.pages.length > 0 : v.pages.length === 0));
export type MenuPdfInput = z.infer<typeof menuPdfInput>;

// Site details (Adatok) -------------------------------------------------------------------

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Adj meg időpontot.");
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "https:// kezdetű linket adj meg.");
const int = (min: number, max: number) =>
  z
    .number({ invalid_type_error: "Adj meg egy számot." })
    .int("Egész számot adj meg.")
    .min(min, `Legalább ${min}.`)
    .max(max, `Legfeljebb ${max}.`);

export const SOCIAL_NETWORKS = ["Instagram", "Facebook", "TikTok"] as const;

export const siteDetailsInput = z.object({
  restaurantName: z.string().trim().min(1, "Add meg az étterem nevét.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 ()/-]{5,24}$/, "Adj meg egy érvényes telefonszámot."),
  email: z.string().trim().email("Adj meg egy érvényes e-mail-címet.").max(254),
  street: z.string().trim().min(1, "Add meg az utcát és a házszámot.").max(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Négyjegyű irányítószámot adj meg."),
  city: z.string().trim().min(1, "Add meg a várost.").max(80),
  companyName: z.string().trim().max(120),
  companyAddress: z.string().trim().max(200),
  taxNumber: z
    .string()
    .trim()
    .regex(/^(\d{8}-\d-\d{2})?$/, "Formátum: 12345678-1-42"),
  regNumber: z
    .string()
    .trim()
    .regex(/^(\d{2}-\d{2}-\d{6})?$/, "Formátum: 01-09-123456"),
  socials: z.object({ Instagram: optionalUrl, Facebook: optionalUrl, TikTok: optionalUrl }),
  hours: z
    .array(
      z
        .object({
          day: z.enum([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ]),
          open: z.boolean(),
          opens: hhmm,
          closes: hhmm,
        })
        .refine((d) => !d.open || d.opens !== d.closes, {
          message: "A nyitás és a zárás nem lehet ugyanakkor.",
          path: ["closes"],
        }),
    )
    .length(7),
  booking: z.object({
    capacity: int(1, 1000),
    maxPartySize: int(1, 100),
    durationMinutes: int(15, 720),
    slotMinutes: int(5, 240),
    daysAhead: int(0, 366),
    minNoticeMinutes: int(0, 10080),
    holdMinutes: int(0, 240),
  }),
});
export type SiteDetailsInput = z.infer<typeof siteDetailsInput>;

// Admin accounts ------------------------------------------------------------------------------

export const inviteInput = z.object({
  email: z.string().trim().toLowerCase().email("Adj meg egy érvényes e-mail-címet.").max(254),
});

export const PASSWORD_MIN_LENGTH = 10;

export const newPasswordInput = z
  .object({
    /** The temporary password again, so a left-open session alone can't set one. */
    currentPassword: z.string().min(1, "Add meg a jelenlegi (ideiglenes) jelszavad."),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Legalább ${PASSWORD_MIN_LENGTH} karakter legyen.`)
      .max(72, "Legfeljebb 72 karakter lehet."),
  })
  .refine((v) => v.password !== v.currentPassword, {
    message: "Az új jelszó nem lehet ugyanaz, mint a jelenlegi.",
    path: ["password"],
  });

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  /** Still on the emailed temporary password. */
  mustChangePassword: boolean;
  hasTwoFactor: boolean;
  isSelf: boolean;
}

/** Result of an invite or reset: whether the email went out; the password only if it did not. */
export interface AccountEmailOutcome {
  email: NotificationStatus;
  /** Shown once to the inviting admin when the email could not be sent. */
  temporaryPassword?: string;
}

export const MENU_PDF_MAX_BYTES = 15 * 1024 * 1024;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Admin server function failures the UI can explain. */
export const ADMIN_ERRORS = {
  unauthorized: "Lejárt a bejelentkezésed. Jelentkezz be újra.",
  forbidden: "Ehhez nincs jogosultságod, vagy a tétel már nem létezik.",
  user_exists: "Ezzel az e-mail-címmel már van fiók.",
  self: "A saját fiókodat nem törölheted és nem állíthatod vissza.",
  last_admin: "Ő az utolsó admin, nem törölhető.",
  weak_password: "Ez a jelszó túl gyenge vagy túl gyakori. Válassz másikat.",
  wrong_password: "A jelenlegi jelszó nem stimmel.",
  unknown: "Valami hiba történt. Próbáld újra.",
} as const;
export type AdminErrorCode = keyof typeof ADMIN_ERRORS;

export type AdminResult<T = null> = { ok: true; data: T } | { ok: false; error: AdminErrorCode };

/** What happened to the guest email that went out with a decision. */
export interface DecisionOutcome {
  email: NotificationStatus;
}
