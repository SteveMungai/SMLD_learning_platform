import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateFullName } from "@/lib/names";

// Update the signed-in user's display name (used in grading and on the certificate).
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Malformed request." }, { status: 400 });
  }

  const check = validateFullName(body.name);
  if (!check.ok) return NextResponse.json({ message: check.error }, { status: 400 });

  try {
    await prisma.user.update({ where: { UserID: userId }, data: { FullName: check.value } });
    return NextResponse.json({ message: "Name updated.", name: check.value });
  } catch (err) {
    console.error("Update-profile error:", err);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
