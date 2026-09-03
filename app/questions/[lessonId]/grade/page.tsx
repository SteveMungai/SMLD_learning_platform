import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";
import GradingView from "@/components/GradingView";
import type { GradingAssignmentData } from "@/components/types";

type PageProps = {
  params: { lessonId: string };
};

export default async function GradePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Grading is instructor/admin-only — no logged-out preview for this page,
  // unlike the student-facing questions page.
  if (!session?.user || (role !== "INSTRUCTOR" && role !== "ADMIN")) {
    redirect("/login");
  }

  const assignment = await prisma.assignment.findFirst({
    where: { LessonID: params.lessonId },
    include: {
      questions: { orderBy: { SequenceOrder: "asc" } },
      submissions: {
        where: { Status: { in: ["SUBMITTED", "LATE"] } },
        include: {
          student: true,
          answers: true,
          grade: true,
        },
        orderBy: { SubmittedAt: "asc" },
      },
    },
  });

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: "#6b7280" }}>
        No assignment has been published for this lesson yet.
      </div>
    );
  }

  const deadline = assignment.DeadlineDate;

  const data: GradingAssignmentData = {
    AssignmentID: assignment.AssignmentID,
    LessonID: assignment.LessonID,
    CohortID: assignment.CohortID,
    Title: assignment.Title,
    Description: assignment.Description,
    DeadlineDate: assignment.DeadlineDate.toISOString(),
    MaxScore: assignment.MaxScore,
    questions: assignment.questions,
    submissions: assignment.submissions.map((s) => ({
      SubmissionID: s.SubmissionID,
      StudentID: s.StudentID,
      StudentName: s.student.FullName ?? s.student.Email,
      SubmittedAt: s.SubmittedAt ? s.SubmittedAt.toISOString() : null,
      Status: s.Status,
      IsLate: s.SubmittedAt ? s.SubmittedAt > deadline : false,
      answers: s.answers.map((a) => ({
        AnswerID: a.AnswerID,
        SubmissionID: a.SubmissionID,
        QuestionID: a.QuestionID,
        AnswerText: a.AnswerText,
        ScoreAwarded: a.ScoreAwarded,
        Feedback: a.Feedback,
        GradedByID: a.GradedByID,
        GradedAt: a.GradedAt ? a.GradedAt.toISOString() : null,
      })),
      grade: s.grade
        ? {
            GradeID: s.grade.GradeID,
            TotalScore: s.grade.TotalScore,
            MaxPossibleScore: s.grade.MaxPossibleScore,
            OverallFeedback: s.grade.OverallFeedback,
            Status: s.grade.Status,
          }
        : null,
    })),
  };

  return <GradingView assignment={data} />;
}