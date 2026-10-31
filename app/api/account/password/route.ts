import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

// Change password for the signed-in user.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Malformed request." }, { status: 400 });
  }
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { UserID: userId } });
    if (!user) return NextResponse.json({ message: "Account not found." }, { status: 404 });

    // Accounts created through Google have no password yet, so there's nothing to verify.
    if (user.Password) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.Password))) {
        return NextResponse.json({ message: "Your current password is incorrect." }, { status: 400 });
      }
      if (await bcrypt.compare(newPassword, user.Password)) {
        return NextResponse.json({ message: "Choose a password different from your current one." }, { status: 400 });
      }
    }

    // Bumping TokenVersion signs out every session, including this one; the client
    // signs back in right away to get a fresh token (see AccountSettings).
    await prisma.user.update({
      where: { UserID: userId }, data: { Password: await bcrypt.hash(newPassword, 12), TokenVersion: { increment: 1 } },
    });
    return NextResponse.json({ message: "Password updated. Other devices have been signed out." });
  } catch (err) {
    console.error("Change-password error:", err);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
