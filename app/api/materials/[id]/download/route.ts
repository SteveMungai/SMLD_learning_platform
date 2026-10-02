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

  const note = await prisma.note.findUnique({
    where: { NoteID: id },
    include: { lesson: { include: { course: true } } },
  });

  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.cohortMembership.findFirst({
    where: {
      UserID: session.user.id,
      CohortID: note.lesson.course.CohortID,
      Status: "ACTIVE",
    },
  });

  const user = await prisma.user.findUnique({
    where: { UserID: session.user.id },
    select: { Role: true },
  });

  const allowed = user?.Role !== "STUDENT" || !!membership;

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!note.FileLink) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 });
  }

  // If using R2: generate a signed URL here and redirect
  return NextResponse.redirect(note.FileLink);
}