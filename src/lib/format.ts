const NBSP = "\u00a0";

/** Hungarian thousands grouping, also for 4-digit numbers: 4290 -> "4 290" (non-breaking). */
export const formatNumber = (n: number) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

export const formatFt = (n: number) => `${formatNumber(n)}${NBSP}Ft`;

/** "12:00 – 23:00", or "Zárva" when closed. */
export const formatHours = (h: { opens: string | null; closes: string | null }) =>
  h.opens && h.closes ? `${h.opens} – ${h.closes}` : "Zárva";
