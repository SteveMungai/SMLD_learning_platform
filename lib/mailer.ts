// lib/mailer.ts
//
// Sends email over SMTP via nodemailer. Configure in .env:
//   SMTP_HOST=smtp.example.com
//   SMTP_PORT=587            (465 = implicit TLS)
//   SMTP_USER=...
//   SMTP_PASS=...
//   EMAIL_FROM="SMLD <no-reply@yourdomain.org>"
//
// With no SMTP_HOST set, outside production the message is printed to the server
// console instead (so the reset flow can be tried locally). In production an
// unconfigured mailer throws.
import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html: string };

export async function sendMail({ to, subject, text, html }: Mail) {
  const host = process.env.SMTP_HOST;

  if (!host) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_HOST is not configured; cannot send email.");
    }
    console.log(`\n[mailer:dev] To: ${to}\n[mailer:dev] Subject: ${subject}\n${text}\n`);
    return;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}
