import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";
import GradingView from "@/components/GradingView";
import { isValidFullName } from "@/lib/names";
import type { GradingAssignmentData } from "@/components/types";

type PageProps = {
  // Next 15+ delivers route params as a Promise.
  params: Promise<{ lessonId: string }>;
};

export default async function GradePage({ params }: PageProps) {
  const { lessonId } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || (role !== "INSTRUCTOR" && role !== "ADMIN")) {
    redirect("/login");
  }

  const assignment = await prisma.assignment.findFirst({
    where: { LessonID: lessonId, Status: "PUBLISHED" },
    include: {
      lesson: { select: { Title: true, SequenceOrder: true, course: { select: { Title: true } } } },
      questions: { orderBy: { SequenceOrder: "asc" } },
      submissions: {
        where: { Status: { in: ["SUBMITTED", "LATE"] } },
        include: {
          student: true,
          answers: true,
          grade: true,
          attachments: {
            select: { AttachmentID: true, FileName: true, FileSizeKB: true, ContentType: true },
            orderBy: { DateUploaded: "asc" },
          },
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

  // Cohort students who haven't handed in (submissions above only holds SUBMITTED / LATE ones).
  const roster = await prisma.cohortMembership.findMany({
    where: { CohortID: assignment.CohortID, Status: "ACTIVE", user: { Role: "STUDENT" } },
    select: { user: { select: { UserID: true, FullName: true, Email: true } } },
  });
  const submittedIds = new Set(assignment.submissions.map((s) => s.StudentID));
  const missing = roster
    .map((m) => m.user)
    .filter((u) => !submittedIds.has(u.UserID))
    .map((u) => ({
      StudentID: u.UserID,
      StudentName: u.FullName ?? u.Email,
      StudentEmail: u.Email,
      NameValid: isValidFullName(u.FullName),
    }))
    .sort((a, b) => a.StudentName.localeCompare(b.StudentName));

  // Published assignments always have a deadline; the fallback only satisfies the type.
  const deadline = assignment.DeadlineDate ?? new Date(0);

  const data: GradingAssignmentData = {
    AssignmentID: assignment.AssignmentID,
    LessonID: assignment.LessonID,
    CohortID: assignment.CohortID,
    Title: assignment.Title,
    Description: assignment.Description,
    DeadlineDate: deadline.toISOString(),
    Status: assignment.Status,
    AcceptLate: assignment.AcceptLate,
    lesson: {
      LessonID: assignment.LessonID,
      Title: assignment.lesson.Title,
      SequenceOrder: assignment.lesson.SequenceOrder,
      CourseTitle: assignment.lesson.course.Title,
    },
    missing,
    MaxScore: assignment.MaxScore,
    questions: assignment.questions,
    submissions: assignment.submissions.map((s) => ({
      SubmissionID: s.SubmissionID,
      StudentID: s.StudentID,
      StudentName: s.student.FullName ?? s.student.Email,
      StudentEmail: s.student.Email,
      NameValid: isValidFullName(s.student.FullName),
      attachments: s.attachments,
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