import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Serves a note's PDF to the on-screen viewer. 
//   - only people who may open the lesson get it (admins, or active members of its cohort);
//   - it is never cached, so no copy is left in the browser's cache folder.


const NAVIGATION = new Set(["document", "iframe", "frame", "embed", "object"]);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (req.headers.get("x-doc-viewer") !== "1" || NAVIGATION.has(req.headers.get("sec-fetch-dest") ?? "")) {
    return NextResponse.json({ error: "This document can only be read inside the lesson page." }, { status: 403 });
  }
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const note = await prisma.note.findUnique({
    where: { NoteID: id },
    select: { file: { select: { Data: true } }, lesson: { select: { course: { select: { CohortID: true } } } } },
  });
  if (!note?.file) return NextResponse.json({ error: "No document attached." }, { status: 404 });

  if (user.role !== "ADMIN") {
    const membership = await prisma.cohortMembership.findFirst({
      where: { UserID: user.id, CohortID: note.lesson.course.CohortID, Status: "ACTIVE" },
      select: { UserID: true },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return new Response(new Uint8Array(note.file.Data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
