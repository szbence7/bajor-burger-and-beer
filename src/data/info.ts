export interface OpeningHour {
  day: string;
  hours: string;
}

export const openingHours: OpeningHour[] = [
  { day: "Hétfő", hours: "Zárva" },
  { day: "Kedd – Csütörtök", hours: "12:00 – 23:00" },
  { day: "Péntek", hours: "12:00 – 01:00" },
  { day: "Szombat", hours: "12:00 – 01:00" },
  { day: "Vasárnap", hours: "12:00 – 22:00" },
];

export const contact = {
  address: "1075 Budapest, Kazinczy utca 12.",
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

export const formatFt = (n: number) => `${n.toLocaleString("hu-HU").replace(/,/g, " ")} Ft`;
