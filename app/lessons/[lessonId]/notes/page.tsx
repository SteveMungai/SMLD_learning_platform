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

  const rows = await prisma.note.findMany({ where: { LessonID: lessonId }, orderBy: { NoteID: "asc" } });
  const notes: NoteItem[] = rows.map((n) => ({ id: n.NoteID, title: n.Title, content: n.Content, hasFile: !!n.FileLink }));

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
    <LessonShell lessonId={lessonId} role={role} topicNumber={lesson.SequenceOrder} title={lesson.Title}>
      {isStaff ? <LecturerNotesView lessonId={lessonId} notes={notes} /> : <StudentNotesView lessonId={lessonId} notes={notes} assignment={assignment} />}
    </LessonShell>
  );
}
