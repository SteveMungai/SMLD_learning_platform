import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const material = await prisma.material.findUnique({
    where: { id },
    include: { week: { include: { cohort: true } } },
  });

  if (!material) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cohortId: true, role: true },
  });

  const allowed =
    user?.role !== "STUDENT" || user?.cohortId === material.week.cohortId;

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If using R2: generate a signed URL here and redirect
  return NextResponse.redirect(material.fileUrl);
}