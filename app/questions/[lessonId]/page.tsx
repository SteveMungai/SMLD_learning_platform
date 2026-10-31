import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QuestionsPageClient from "@/components/QuestionsPageClient";

type PageProps = {
  // Next 15+ delivers route params as a Promise.
  params: Promise<{ lessonId: string }>;
};

export default async function QuestionsPage({ params }: PageProps) {
  const { lessonId } = await params;
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  const role = session?.user?.role;
  const userId = session?.user?.id;

  // Logged out, hand off to mock data in the client.
  if (!isAuthenticated) {
    return (
      <QuestionsPageClient
        isAuthenticated={false}
        role={undefined}
        lessonId={lessonId}
        lesson={null}
        assignment={null}
        existingSubmission={null}
      />
    );
  }

  const lesson = await prisma.lesson.findUnique({
    where: { LessonID: lessonId },
    include: { course: { select: { Title: true, CohortID: true } } },
  });
  if (!lesson) notFound();

  const isStaff = role === "INSTRUCTOR" || role === "ADMIN";

  if (!isStaff) {
    const membership = await prisma.cohortMembership.findFirst({
      where: { UserID: userId, CohortID: lesson.course.CohortID, Status: "ACTIVE" },
    });
    if (!membership) notFound();
  }

  // Questions are tied to this lesson. Lecturers see drafts; students only see published work.
  const assignment = await prisma.assignment.findFirst({
    where: { LessonID: lessonId, ...(isStaff ? {} : { Status: "PUBLISHED" }) },
    include: { questions: { orderBy: { SequenceOrder: "asc" } } },
  });

  const existingSubmission =
    assignment && role === "STUDENT" && userId
      ? await prisma.submission.findUnique({
          where: { AssignmentID_StudentID: { AssignmentID: assignment.AssignmentID, StudentID: userId } },
          include: {
            answers: true,
            grade: true,
            attachments: {
              select: { AttachmentID: true, FileName: true, FileSizeKB: true, ContentType: true },
              orderBy: { DateUploaded: "asc" },
            },
          },
        })
      : null;

  return (
    <QuestionsPageClient
      isAuthenticated
      role={role}
      lessonId={lessonId}
      lesson={{
        LessonID: lesson.LessonID,
        Title: lesson.Title,
        SequenceOrder: lesson.SequenceOrder,
        CourseTitle: lesson.course.Title,
      }}
      // Dates aren't serializable across the server→client boundary as Date
      // objects, so convert to ISO strings here.
      assignment={
        assignment
          ? { ...assignment, DeadlineDate: assignment.DeadlineDate?.toISOString() ?? null }
          : null
      }
      existingSubmission={
        existingSubmission
          ? {
              SubmissionID: existingSubmission.SubmissionID,
              AssignmentID: existingSubmission.AssignmentID,
              StudentID: existingSubmission.StudentID,
              Status: existingSubmission.Status,
              ReceiptCode: existingSubmission.ReceiptCode,
              SubmittedAt: existingSubmission.SubmittedAt?.toISOString() ?? null,
              attachments: existingSubmission.attachments,
              answers: existingSubmission.answers.map((a) => ({
                ...a,
                GradedAt: a.GradedAt ? a.GradedAt.toISOString() : null,
              })),
              // Scores are only revealed once the lecturer has finalised the grade.
              grade:
                existingSubmission.grade?.Status === "COMPLETE"
                  ? {
                      TotalScore: existingSubmission.grade.TotalScore,
                      MaxPossibleScore: existingSubmission.grade.MaxPossibleScore,
                      OverallFeedback: existingSubmission.grade.OverallFeedback,
                      Status: existingSubmission.grade.Status,
                    }
                  : null,
            }
          : null
      }
    />
  );
}
