import nodemailer, { type Transporter } from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export type SendResult =
  { status: "sent" } | { status: "skipped"; error: string } | { status: "failed"; error: string };

let transport: Transporter | undefined;

/**
 * SMTP settings from the runtime environment (any provider: the host's mailbox, Brevo,
 * Mailgun, …). Without SMTP_HOST and SMTP_FROM nothing is sent and every attempt is logged
 * as skipped, so the admin panel shows that emails are not going out.
 */
function getTransport(): Transporter | undefined {
  const host = process.env["SMTP_HOST"];
  if (!host || !process.env["SMTP_FROM"]) return undefined;
  if (!transport) {
    const port = Number(process.env["SMTP_PORT"] || 587);
    const user = process.env["SMTP_USER"];
    transport = nodemailer.createTransport({
      host,
      port,
      // Port 465 speaks TLS from the start; 587/25 upgrade with STARTTLS.
      secure: /^(1|true|yes)$/i.test(process.env["SMTP_SECURE"] ?? "") || port === 465,
      ...(user && { auth: { user, pass: process.env["SMTP_PASS"] ?? "" } }),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transport;
}

export async function sendMail(mail: Mail): Promise<SendResult> {
  const smtp = getTransport();
  if (!smtp) return { status: "skipped", error: "Az e-mail-küldés nincs beállítva (SMTP)." };
  try {
    await smtp.sendMail({ from: process.env["SMTP_FROM"], ...mail });
    return { status: "sent" };
  } catch (error) {
    console.error(`Email to ${mail.to} failed:`, error);
    return { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}
