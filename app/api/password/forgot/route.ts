import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { hashToken, resetIdentifier, RESET_TOKEN_TTL_MS } from "@/lib/password";

// Same answer whether or not the email exists, so this can't be used to find accounts.
const GENERIC = { message: "If an account exists for that email, a reset link is on its way." };

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    /* fall through to validation */
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { Email: email } });
    if (!user) return NextResponse.json(GENERIC);

    const identifier = resetIdentifier(email);

    //  if a link was issued in the last minute, don't send another.
    const recent = await prisma.verificationToken.findFirst({
      where: { identifier, expires: { gt: new Date(Date.now() + RESET_TOKEN_TTL_MS - 60_000) } },
    });
    if (recent) return NextResponse.json(GENERIC);

    const token = randomBytes(32).toString("hex");
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: { identifier, token: hashToken(token), expires: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });

    // Build the link from NEXTAUTH_URL
    const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const link = `${base}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendMail({
      to: email,
      subject: "Reset your SMLD password",
      text: `Hi${user.FullName ? " " + user.FullName : ""},\n\nUse this link to choose a new password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
      html: `<p>Hi${user.FullName ? " " + user.FullName : ""},</p><p>Use the button below to choose a new password. The link is valid for 1 hour.</p><p><a href="${link}" style="background:#E02020;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p><p style="color:#6b7280;font-size:13px">If you didn't ask for this, you can ignore this email.</p>`,
    });
  } catch (err) {
    // Log, but still answer generically so failures don't leak which emails exist.
    console.error("Forgot-password error:", err);
  }

  return NextResponse.json(GENERIC);
}
