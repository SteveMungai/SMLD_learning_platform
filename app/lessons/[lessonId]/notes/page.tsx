import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireLessonAccess } from "@/lib/lessonAccess";
import LessonShell from "@/components/lessons/LessonShell";
import StudentNotesView, { type AssignmentStatus } from "@/components/lessons/StudentNotesView";
import LecturerNotesView from "@/components/lessons/LecturerNotesView";
import type { NoteItem } from "@/components/lessons/shared";

const when = (d: Date) =>
  d.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function LessonNotesPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { userId, role, isStaff, lesson } = await requireLessonAccess(lessonId);

  const rows = await prisma.note.findMany({
    where: { LessonID: lessonId },
    orderBy: [{ DateUploaded: "asc" }, { NoteID: "asc" }],
   
    include: { file: { select: { FileName: true, SizeKB: true } } },
  });
  const notes: NoteItem[] = rows.map((n) => ({
    id: n.NoteID,
    title: n.Title,
    content: n.Content,
    dateUploaded: n.DateUploaded.toISOString(),
    file: n.file ? { name: n.file.FileName, sizeKB: n.file.SizeKB } : null,
    hasLegacyLink: !!n.FileLink,
  }));
  // Printed faintly across every page of a document, so a photo of the screen can be traced back.
  const sessionUser = (await getServerSession(authOptions))?.user;
  const viewerLabel = `${sessionUser?.name ?? sessionUser?.email ?? "SMLD learner"} · ${new Date().toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" })}`;

  let assignment: AssignmentStatus = null;
  if (!isStaff) {
    // Students see the assignment's status and their grade; lecturer drafts stay hidden.
    const a = await prisma.assignment.findFirst({
      where: { LessonID: lessonId, Status: "PUBLISHED" },
      include: { submissions: { where: { StudentID: userId }, include: { grade: true } } },
    });
    if (a && a.DeadlineDate) {
      const mine = a.submissions[0];
      const handedIn = !!mine && mine.Status !== "DRAFT";
      const graded = mine?.grade?.Status === "COMPLETE";
      assignment = {
        title: a.Title,
        dueText: when(a.DeadlineDate),
        pastDue: new Date() > a.DeadlineDate,
        acceptLate: a.AcceptLate,
        progress: graded ? "graded" : handedIn ? "submitted" : mine ? "draft" : "none",
        submittedLate: handedIn && !!mine?.SubmittedAt && mine.SubmittedAt > a.DeadlineDate,
        // Scores are revealed only once the lecturer has finalised the grade.
        grade: graded && mine?.grade ? { total: mine.grade.TotalScore, max: mine.grade.MaxPossibleScore } : null,
      };
    }
  }

  return (
    <LessonShell lessonId={lessonId} role={role} topicNumber={lesson.SequenceOrder} title={lesson.Title} lecturerName={lesson.createdBy?.FullName}>
      {isStaff ? <LecturerNotesView lessonId={lessonId} notes={notes} viewerLabel={viewerLabel} /> : <StudentNotesView lessonId={lessonId} notes={notes} assignment={assignment} viewerLabel={viewerLabel} />}
    </LessonShell>
  );
}
