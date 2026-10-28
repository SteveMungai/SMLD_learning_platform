import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken, resetIdentifier, MIN_PASSWORD_LENGTH } from "@/lib/password";

const INVALID = "This reset link is invalid or has expired. Please request a new one.";

export async function POST(req: Request) {
  let body: { token?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Malformed request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");

  if (!email || !token) return NextResponse.json({ message: INVALID }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 });
  }

  try {
    const identifier = resetIdentifier(email);
    const record = await prisma.verificationToken.findUnique({ where: { token: hashToken(token) } });
    if (!record || record.identifier !== identifier || record.expires < new Date()) {
      return NextResponse.json({ message: INVALID }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { Email: email }, data: { Password: hashed } }),
      // Single use: remove every outstanding reset token for this account.
      prisma.verificationToken.deleteMany({ where: { identifier } }),
    ]);

    return NextResponse.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error("Reset-password error:", err);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
