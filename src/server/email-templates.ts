// Notification emails (Hungarian). Self-contained HTML with inline styles, because mail
// clients ignore stylesheets; colours mirror the theme tokens in src/styles.css. Every value
// that came from a guest or the staff is escaped.
import type { ReservationNotificationKind } from "@/features/admin/schema";
import type { SiteInfo } from "@/data/info";
import { formatDateHu } from "@/lib/date";
import { absoluteUrl } from "@/lib/site";
import type { Mail } from "./mailer";

export interface ReservationDetails {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  partySize: number;
  name: string;
  phone: string;
  email: string;
  note: string;
  /** Message from the staff that goes out with a decision. */
  decisionNote?: string;
}

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

interface Content {
  subject: string;
  heading: string;
  /** Plain-text paragraphs. */
  intro: string[];
  /** Quoted message from the staff. */
  quote?: string;
  rows: [string, string][];
  outro: string[];
  directions?: { href: string; label: string }[];
  link?: { href: string; label: string };
}

function render(c: Content, siteName: string, to: string, replyTo?: string): Mail {
  const text = [
    c.heading,
    "",
    ...c.intro,
    ...(c.quote ? ["", `„${c.quote}”`] : []),
    "",
    ...c.rows.map(([k, v]) => `${k}: ${v}`),
    ...(c.directions ? ["", ...c.directions.map(({ label, href }) => `${label}: ${href}`)] : []),
    "",
    ...c.outro,
    ...(c.link ? ["", `${c.link.label}: ${c.link.href}`] : []),
    "",
    siteName,
  ].join("\n");

  const p = (s: string) => `<p style="margin:0 0 14px">${escapeHtml(s)}</p>`;
  const html = `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(c.subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#121110;color:#f5efe6;font:16px/1.55 -apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#1c1a18;border:1px solid #2e2a26;border-radius:20px;padding:28px">
<p style="margin:0 0 18px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#d2ac66">${escapeHtml(siteName)}</p>
<h1 style="margin:0 0 18px;font:700 26px/1.2 'Arial Narrow',Arial,sans-serif;text-transform:uppercase;color:#f5efe6">${escapeHtml(c.heading)}</h1>
${c.intro.map(p).join("\n")}
${c.quote ? `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #d2ac66;background:#121110;border-radius:8px;color:#f5efe6">${escapeHtml(c.quote)}</blockquote>` : ""}
<table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0 18px">
${c.rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:8px 0;border-bottom:1px solid #2e2a26;color:#a89f94;vertical-align:top">${escapeHtml(k)}</td><td style="padding:8px 0 8px 12px;border-bottom:1px solid #2e2a26;text-align:right;font-weight:700;word-break:break-word">${escapeHtml(v)}</td></tr>`,
  )
  .join("\n")}
</table>
${
  c.directions
    ? `<table role="presentation" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:0 0 18px"><tr>${c.directions
        .map(
          ({ href, label }) =>
            `<td style="width:33.33%;padding:0 3px;text-align:center;vertical-align:middle"><a href="${escapeHtml(href)}" style="display:block;padding:12px 3px;border:1px solid #d2ac66;border-radius:10px;color:#d2ac66;font-size:12px;line-height:18px;font-weight:700;text-decoration:none;white-space:nowrap">${escapeHtml(label)}</a></td>`,
        )
        .join("")}</tr></table>`
    : ""
}
${c.outro.map(p).join("\n")}
${c.link ? `<p style="margin:20px 0 0"><a href="${escapeHtml(c.link.href)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#d2ac66;color:#121110;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:.08em;font-size:13px">${escapeHtml(c.link.label)}</a></p>` : ""}
</div>
</body></html>`;

  return { to, subject: c.subject, text, html, ...(replyTo && { replyTo }) };
}

const bookingRows = (r: ReservationDetails): [string, string][] => [
  ["Dátum", formatDateHu(r.date)],
  ["Időpont", r.time],
  ["Létszám", `${r.partySize} fő`],
  ["Név", r.name],
];

/** The email for one notification kind; `to` is the guest, or the staff for staff_new. */
export function buildEmail(
  kind: ReservationNotificationKind,
  r: ReservationDetails,
  site: SiteInfo,
  to: string,
): Mail {
  const { phone, address, email: venueEmail } = site.contact;
  const callUs = `Kérdésed van? Hívj minket: ${phone}, vagy válaszolj erre a levélre.`;
  const quote = r.decisionNote?.trim() || undefined;
  const withQuote = quote ? { quote } : {};

  switch (kind) {
    case "guest_received":
      return render(
        {
          subject: `Megkaptuk a foglalásodat — ${site.name}`,
          heading: "Megkaptuk a foglalásodat",
          intro: [
            `Kedves ${r.name}!`,
            "Köszönjük a foglalást. Hamarosan visszaigazoljuk egy újabb e-mailben.",
          ],
          rows: bookingRows(r),
          outro: [callUs],
        },
        site.name,
        to,
        venueEmail,
      );
    case "guest_confirmed":
      return render(
        {
          subject: `Visszaigazoltuk a foglalásodat — ${site.name}`,
          heading: "Várunk szeretettel!",
          intro: [`Kedves ${r.name}!`, "A foglalásodat visszaigazoltuk."],
          ...withQuote,
          rows: [...bookingRows(r), ["Cím", address]],
          // HTTPS app links also work when the guest has no native navigation app installed.
          directions: [
            {
              label: "Apple Maps",
              href: `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`,
            },
            {
              label: "Waze",
              href: `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`,
            },
            {
              label: "Google Maps",
              href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving&dir_action=navigate`,
            },
          ],
          outro: [
            `Az asztalt ${site.booking.holdMinutes} percig tartjuk. Ha mégsem tudsz jönni, kérjük, szólj: ${phone}.`,
          ],
        },
        site.name,
        to,
        venueEmail,
      );
    case "guest_rejected":
      return render(
        {
          subject: `A foglalásodat sajnos nem tudjuk fogadni — ${site.name}`,
          heading: "Sajnos most nem megy",
          intro: [
            `Kedves ${r.name}!`,
            "Sajnáljuk, de erre az időpontra nem tudjuk fogadni a foglalásodat.",
          ],
          ...withQuote,
          rows: bookingRows(r),
          outro: [`Hívj minket a ${phone} számon, és keresünk másik időpontot.`],
          link: { href: absoluteUrl("/#foglalas"), label: "Új időpontot választok" },
        },
        site.name,
        to,
        venueEmail,
      );
    case "guest_cancelled":
      return render(
        {
          subject: `Foglalás lemondva — ${site.name}`,
          heading: "Foglalás lemondva",
          intro: [`Kedves ${r.name}!`, "Az alábbi foglalásodat lemondtuk."],
          ...withQuote,
          rows: bookingRows(r),
          outro: [callUs],
        },
        site.name,
        to,
        venueEmail,
      );
    case "staff_new":
      return render(
        {
          subject: `Új foglalás: ${formatDateHu(r.date)} ${r.time}, ${r.partySize} fő`,
          heading: "Új foglalás érkezett",
          intro: ["Az online foglalás jóváhagyásra vár."],
          rows: [
            ...bookingRows(r),
            ["Telefon", r.phone],
            ["E-mail", r.email],
            ...(r.note ? ([["Megjegyzés", r.note]] as [string, string][]) : []),
          ],
          outro: [],
          link: { href: absoluteUrl("/admin"), label: "Megnyitom az adminban" },
        },
        site.name,
        to,
        r.email,
      );
  }
}

/** Invitation (or account reset) for a staff member, with the temporary password. */
export function buildAccountEmail(
  kind: "admin_invite" | "admin_reset",
  site: SiteInfo,
  to: string,
  temporaryPassword: string,
): Mail {
  const invite = kind === "admin_invite";
  return render(
    {
      subject: invite
        ? `Meghívó a ${site.name} admin felületére`
        : `Visszaállítottuk a ${site.name} admin fiókodat`,
      heading: invite ? "Meghívtak az admin felületre" : "Új ideiglenes jelszó",
      intro: [
        invite
          ? "Fiókot kaptál a foglalások és a weboldal kezeléséhez."
          : "Visszaállították az admin fiókodat: új ideiglenes jelszót kaptál, és a kétlépcsős azonosítást újra be kell állítanod.",
        "Az első belépéskor meg kell adnod egy saját jelszót, majd be kell állítanod egy hitelesítő alkalmazást (pl. Google Authenticator) a telefonodon. Enélkül nem lehet belépni.",
      ],
      rows: [
        ["E-mail", to],
        ["Ideiglenes jelszó", temporaryPassword],
      ],
      outro: ["Ha nem számítottál erre a levélre, töröld, és szólj a vezetőnek."],
      link: { href: absoluteUrl("/admin"), label: "Belépés" },
    },
    site.name,
    to,
  );
}
