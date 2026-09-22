import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QuestionsPageClient from "@/components/QuestionsPageClient";

type PageProps = {
  params: { lessonId: string };
};


type SessionRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export default async function QuestionsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  const role = (session?.user as { role?: SessionRole } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  // Logged out, hand off to mock data in the client.
  if (!isAuthenticated) {
    return (
      <QuestionsPageClient
        isAuthenticated={false}
        role={undefined}
        lessonId={params.lessonId}
        assignment={null}
        existingSubmission={null}
      />
    );
  }

  const assignment = await prisma.assignment.findFirst({
    where: { LessonID: params.lessonId },
    include: {
      questions: { orderBy: { SequenceOrder: "asc" } },
    },
  });

  let existingSubmission = null;
  if (assignment && role === "STUDENT" && userId) {
    existingSubmission = await prisma.submission.findUnique({
      where: {
        AssignmentID_StudentID: {
          AssignmentID: assignment.AssignmentID,
          StudentID: userId,
        },
      },
      include: { answers: true },
    });
  }

  return (
    <QuestionsPageClient
      isAuthenticated
      role={role}
      lessonId={params.lessonId}
      // Dates aren't serializable across the server→client boundary as Date
      // objects, so convert to ISO strings here.
      assignment={
        assignment
          ? {
              ...assignment,
              DeadlineDate: assignment.DeadlineDate.toISOString(),
            }
          : null
      }
      existingSubmission={
        existingSubmission
          ? {
              ...existingSubmission,
              SubmittedAt: existingSubmission.SubmittedAt
                ? existingSubmission.SubmittedAt.toISOString()
                : null,
              answers: existingSubmission.answers.map((a) => ({
                ...a,
                GradedAt: a.GradedAt ? a.GradedAt.toISOString() : null,
              })),
            }
          : null
      }
    />
  );
}