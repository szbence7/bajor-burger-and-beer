import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createTransport, send } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  send: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: { createTransport } }));
import { sendMail } from "./mailer";

const mail = { to: "guest@example.com", subject: "Teszt", text: "Teszt", html: "<p>Teszt</p>" };
beforeEach(() => {
  for (const key of ["HOST", "PORT", "SECURE", "USER", "PASS", "FROM"]) {
    vi.stubEnv(`SMTP_${key}`, "");
  }
  createTransport.mockReset().mockReturnValue({ sendMail: send });
  send.mockReset().mockResolvedValue({ accepted: [mail.to] });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("SMTP delivery", () => {
  it("skips unconfigured SMTP without attempting a connection", async () => {
    await expect(sendMail(mail)).resolves.toMatchObject({ status: "skipped" });
    expect(createTransport).not.toHaveBeenCalled();
  });
  it("requires a password when a user is configured", async () => {
    vi.stubEnv("SMTP_USER", "booking@example.com");
    await expect(sendMail(mail)).resolves.toMatchObject({
      status: "skipped",
      error: expect.stringContaining("SMTP_PASS"),
    });
    expect(createTransport).not.toHaveBeenCalled();
  });
  it("uses authenticated TLS on port 465 and forwards the sender and reply-to", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_USER", "booking@example.com");
    vi.stubEnv("SMTP_PASS", "secret");
    vi.stubEnv("SMTP_FROM", "Bajor <booking@example.com>");
    await expect(sendMail({ ...mail, replyTo: "staff@example.com" })).resolves.toEqual({
      status: "sent",
    });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.com",
        port: 465,
        secure: true,
        auth: { user: "booking@example.com", pass: "secret" },
      }),
    );
    expect(send).toHaveBeenCalledWith({
      ...mail,
      from: "Bajor <booking@example.com>",
      replyTo: "staff@example.com",
    });
  });
  it("returns failed when connecting or sending fails", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_FROM", "booking@example.com");
    vi.spyOn(console, "error").mockImplementation(() => {});
    createTransport.mockImplementationOnce(() => {
      throw new Error("Invalid configuration");
    });
    await expect(sendMail(mail)).resolves.toEqual({
      status: "failed",
      error: "Invalid configuration",
    });
    send.mockRejectedValueOnce(new Error("Authentication failed"));
    await expect(sendMail(mail)).resolves.toEqual({
      status: "failed",
      error: "Authentication failed",
    });
  });
});
