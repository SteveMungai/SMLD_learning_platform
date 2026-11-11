import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCohort } from "@/lib/access";
import { checkNoteFile, looksLikePdf, MAX_NOTE_FILE_BYTES } from "@/lib/noteFiles";

// Admin can attach, replace or remove the PDF on a note. A lecturer can only do this in their own cohorts.

async function authorize(noteId: string) {
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") return { error: NextResponse.json({ error: "Only lecturers can do this." }, { status: 403 }) };
  const note = await prisma.note.findUnique({ where: { NoteID: noteId }, select: { lesson: { select: { course: { select: { CohortID: true } } } } } });
  if (!note) return { error: NextResponse.json({ error: "That note no longer exists." }, { status: 404 }) };
  if (!(await canManageCohort({ id: user.id, role: user.role }, note.lesson.course.CohortID))) {
    return { error: NextResponse.json({ error: "You haven't been added to this cohort." }, { status: 403 }) };
  }
  return { error: null };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if (auth.error) return auth.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "We couldn't read that upload. Try a smaller file." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF to attach." }, { status: 400 });

  const problem = checkNoteFile(file);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > MAX_NOTE_FILE_BYTES) return NextResponse.json({ error: "That file is too large. The limit is 4 MB." }, { status: 400 });
  if (!looksLikePdf(bytes)) return NextResponse.json({ error: "That doesn't look like a real PDF file." }, { status: 400 });

  const fileName = (file.name.split(/[\\/]/).pop() ?? "document.pdf").replace(/[\u0000-\u001f"<>|:*?]/g, "").slice(0, 150) || "document.pdf";
  const data = { FileName: fileName, SizeKB: Math.max(1, Math.round(bytes.length / 1024)), Data: bytes };
  await prisma.noteFile.upsert({ where: { NoteID: id }, create: { NoteID: id, ...data }, update: data });
  return NextResponse.json({ ok: true, fileName, sizeKB: data.SizeKB });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if (auth.error) return auth.error;
  await prisma.noteFile.deleteMany({ where: { NoteID: id } });
  return NextResponse.json({ ok: true });
}
