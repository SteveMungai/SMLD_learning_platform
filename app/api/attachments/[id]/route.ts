import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Streams a submitted file. Only the student who submitted it and lecturers/admins may open it.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const attachment = await prisma.attachment.findUnique({
    where: { AttachmentID: id },
    include: { file: true, submission: { select: { StudentID: true } } },
  });
  if (!attachment?.file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const isStaff = session.user.role === "INSTRUCTOR" || session.user.role === "ADMIN";
  if (!isStaff && attachment.submission.StudentID !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const asciiName = attachment.FileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(attachment.file.Data as unknown as BodyInit, {
    headers: {
      "Content-Type": attachment.ContentType ?? "application/octet-stream",
      // Always a download, never rendered inline, and never sniffed into another type.
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(attachment.FileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Length": String(attachment.file.Data.length),
    },
  });
}
