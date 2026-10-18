export type Weekday =
  "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface OpeningHour {
  /** Display label, e.g. "Kedd – Csütörtök". */
  label: string;
  days: Weekday[];
  /** "HH:MM"; both null when closed. A `closes` earlier than `opens` means after midnight. */
  opens: string | null;
  closes: string | null;
}

export const openingHours: OpeningHour[] = [
  { label: "Hétfő", days: ["Monday"], opens: null, closes: null },
  {
    label: "Kedd – Csütörtök",
    days: ["Tuesday", "Wednesday", "Thursday"],
    opens: "12:00",
    closes: "23:00",
  },
  { label: "Péntek", days: ["Friday"], opens: "12:00", closes: "01:00" },
  { label: "Szombat", days: ["Saturday"], opens: "12:00", closes: "01:00" },
  { label: "Vasárnap", days: ["Sunday"], opens: "12:00", closes: "22:00" },
];

const address = {
  street: "Kazinczy utca 12.",
  postalCode: "1075",
  city: "Budapest",
  country: "HU",
};

export const contact = {
  address: `${address.postalCode} ${address.city}, ${address.street}`,
  addressParts: address,
  phone: "+36 1 234 5678",
  email: "hello@bajorburger.hu",
  socials: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "TikTok", href: "https://tiktok.com" },
  ],
};

export const timeSlots = [
  "12:00",
  "13:00",
  "14:00",
  "17:00",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
];
