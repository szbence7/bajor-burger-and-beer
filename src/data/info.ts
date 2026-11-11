// Content lives in Supabase (site_settings, opening_hours); see src/server/content.ts.
// PLACEHOLDER: the seeded contact data and hours are invented; replace them before launch.

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface OpeningHour {
  /** Display label, e.g. "Kedd – Csütörtök". */
  label: string;
  days: Weekday[];
  /** "HH:MM"; both null when closed. A `closes` earlier than `opens` means after midnight. */
  opens: string | null;
  closes: string | null;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface Contact {
  /** One-line display address: "1075 Budapest, Kazinczy utca 12." */
  address: string;
  addressParts: { street: string; postalCode: string; city: string; country: string };
  phone: string;
  email: string;
  socials: SocialLink[];
}

/** Online booking rules; the database enforces them, the UI uses them for copy and limits. */
export interface BookingSettings {
  slotMinutes: number;
  /** How long a booking holds its table. */
  durationMinutes: number;
  /** Guests allowed at the same time. */
  capacity: number;
  /** Largest party bookable online; above it guests are asked to call. */
  maxPartySize: number;
  daysAhead: number;
  minNoticeMinutes: number;
  /** How long a table is held for late guests. */
  holdMinutes: number;
}

/** The company that runs the restaurant (impresszum, privacy notice). Empty = not shown. */
export interface CompanyInfo {
  name: string;
  address: string;
  taxNumber: string;
  regNumber: string;
}

/** An original menu image or a page rendered from an uploaded PDF. */
export interface MenuPage {
  label?: string;
  language?: "hu" | "en";
  /** Full-size image. Uploaded PDF pages use 1600 px WebP. */
  src: string;
  /** Smaller image, or the original URL when no separate small version exists. */
  srcSmall: string;
  width: number;
  height: number;
  /** The page's text, for screen readers. */
  text: string;
}

export interface SiteInfo {
  /** The restaurant's display name, e.g. "Bajor Burger & Beer". */
  name: string;
  contact: Contact;
  company: CompanyInfo;
  openingHours: OpeningHour[];
  booking: BookingSettings;
  /** The menu PDF (served at /etlap.pdf); null until the staff upload one. */
  menuPdf: { updatedAt: string; pages: MenuPage[] } | null;
}
