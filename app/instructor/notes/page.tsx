import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InstructorWeekCard, type InstructorWeekData, type SubmissionItem } from "@/components/notes/InstructorWeekCard";
import { NotesHero, colors } from "@/components/notes/shared";

export default async function InstructorNotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { UserID: session.user.id },
    select: { Role: true },
  });
  if (user?.Role === "STUDENT") redirect("/notes");

  // No instructor-to-cohort relation exists yet, so every instructor
  // currently sees every cohort's lessons. Revisit once that's modeled.
  const lessons = await prisma.lesson.findMany({
    orderBy: [{ course: { CohortID: "asc" } }, { SequenceOrder: "asc" }],
    include: {
      video: true,
      audio: true,
      notes: true,
      course: {
        include: {
          cohort: {
            include: {
              memberships: {
                where: { Status: "ACTIVE" },
                include: { user: true },
              },
            },
          },
        },
      },
      assignments: {
        include: {
          submissions: {
            include: { student: true, grade: true },
          },
        },
      },
    },
  });

  const weekData: InstructorWeekData[] = lessons.map((lesson, index) => {
    const assignment = lesson.assignments[0] ?? null;
    const roster = lesson.course.cohort.memberships.map((m) => m.user);

    const submissions: SubmissionItem[] = roster.map((student) => {
      const match = assignment?.submissions.find((s) => s.StudentID === student.UserID);
      return {
        id: match?.SubmissionID ?? `pending-${student.UserID}`,
        studentName: student.FullName ?? "Unnamed student",
        submittedAt: match?.SubmittedAt?.toISOString() ?? null,
        status: match ? (match.grade?.Status === "COMPLETE" ? "GRADED" : "SUBMITTED") : null,
        grade: match?.grade?.TotalScore ?? null,
      };
    });

    const materials = [
      lesson.video && {
        id: lesson.video.VideoID,
        type: "VIDEO" as const,
        title: lesson.video.Title,
        fileUrl: lesson.video.YoutubeLink,
      },
      ...lesson.notes.map((n) => ({
        id: n.NoteID,
        type: "NOTES" as const,
        title: n.Title,
        fileUrl: n.FileLink ?? "",
      })),
    ].filter(Boolean) as InstructorWeekData["materials"];

    return {
      id: lesson.LessonID,
      weekNumber: index + 1,
      topic: lesson.Title,
      description: null,
      leader: null,
      passage: null,
      materials,
      assignment: assignment
        ? {
            id: assignment.AssignmentID,
            title: assignment.Title,
            description: assignment.Description ?? "",
            dueDate: assignment.DeadlineDate.toISOString(),
          }
        : null,
      submissions,
    };
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.cream }}>
      <NotesHero
        eyebrow="CITAM — Instructor Dashboard"
        title="This Term's Study Series"
        subtitle="Add weekly notes and videos, post assignments with a due date, and see who's submitted."
      />
      <div className="max-w-3xl mx-auto px-4">
        {weekData.length === 0 ? (
          <p className="text-sm text-gray-500 py-8">No lessons have been posted yet.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {weekData.map((week) => (
              <InstructorWeekCard key={week.id} week={week} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}