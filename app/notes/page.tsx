import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudentWeekCard, type StudentWeekData } from "@/components/notes/StudentWeekCard";
import { NotesHero, colors } from "@/components/notes/shared";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const membership = await prisma.cohortMembership.findFirst({
    where: { UserID: session.user.id, Status: "ACTIVE" },
    select: { CohortID: true },
  });

  if (!membership) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.cream }}>
        <p className="text-gray-600 text-sm">You are not currently assigned to a cohort.</p>
      </div>
    );
  }

    const lessons = await prisma.lesson.findMany({
    where: { course: { CohortID: membership.CohortID } },
    orderBy: { SequenceOrder: "asc" },
    include: {
      video: true,
      audio: true,
      notes: true,
      assignments: {
        include: {
          questions: { orderBy: { SequenceOrder: "asc" } },
          submissions: {
            where: { StudentID: session.user.id },
            include: { grade: true, answers: true },
          },
        },
      },
    },
  });
  const weekData: StudentWeekData[] = lessons.map((lesson, index) => {
    const assignment = lesson.assignments[0] ?? null;
    const mySubmission = assignment?.submissions[0] ?? null;

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
    ].filter(Boolean) as StudentWeekData["materials"];

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
            questions: assignment.questions.map((q) => ({
              id: q.QuestionID,
              text: q.QuestionText,
              maxScore: q.MaxScore,
              type: q.QuestionType,
            })),
          }
        : null,
      mySubmission: mySubmission
        ? {
            id: mySubmission.SubmissionID,
            status: mySubmission.grade?.Status === "COMPLETE" ? "GRADED" : "SUBMITTED",
            submittedAt: mySubmission.SubmittedAt?.toISOString() ?? "",
            grade: mySubmission.grade?.TotalScore ?? null,
            maxScore: mySubmission.grade?.MaxPossibleScore ?? null,
            feedback: mySubmission.grade?.OverallFeedback ?? null,
            answers: mySubmission.answers.map((a) => ({
              questionId: a.QuestionID,
              text: a.AnswerText ?? "",
              score: a.ScoreAwarded,
              feedback: a.Feedback,
            })),
          }
        : null,
    };
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.cream }}>
      <NotesHero
        eyebrow="CITAM — Small Group Study Notes"
        title="This Term's Study Series"
        subtitle="Catch up on this week's notes and teaching video, then submit your assignment before the deadline."
      />
      <div className="max-w-3xl mx-auto px-4">
        <div className="py-6 border-b-2" style={{ borderColor: colors.black }}>
          <p className="text-sm text-gray-500">Tap a week to view notes and assignments</p>
        </div>

        {weekData.length === 0 ? (
          <p className="text-sm text-gray-500 py-8">No lessons have been posted yet.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {weekData.map((week) => (
              <StudentWeekCard key={week.id} week={week} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}