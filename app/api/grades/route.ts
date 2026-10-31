import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (role !== "INSTRUCTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only instructors can grade submissions." }, { status: 403 });
  }

  const body = await req.json();
  const { submissionId, answers, overallFeedback } = body as {
    submissionId: string;
    answers: { questionId: string; score: number; comment?: string }[];
    overallFeedback: string;
  };

  if (!submissionId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Missing submissionId or answers." }, { status: 400 });
  }

  try {
    // Pull the submission with its assignment's questions so we can validate
    // and clamp scores against each question's real MaxScore 
    const submission = await prisma.submission.findUnique({
      where: { SubmissionID: submissionId },
      include: {
        assignment: { include: { questions: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    // Drafts aren't handed in, so there's nothing to grade yet.
    if (submission.Status === "DRAFT") {
      return NextResponse.json({ error: "This student hasn't submitted yet." }, { status: 409 });
    }

    const questionMaxScores = new Map(submission.assignment.questions.map((q) => [q.QuestionID, q.MaxScore]));

    const clampedAnswers = answers
      .filter((a) => questionMaxScores.has(a.questionId))
      .map((a) => {
        const max = questionMaxScores.get(a.questionId)!;
        const clamped = Math.max(0, Math.min(Number(a.score) || 0, max));
        const comment = String(a.comment ?? "").trim().slice(0, 1000);
        return { questionId: a.questionId, score: clamped, comment: comment || null };
      });

    const totalScore = clampedAnswers.reduce((sum, a) => sum + a.score, 0);
    const maxPossibleScore = submission.assignment.questions.reduce((sum, q) => sum + q.MaxScore, 0);

    await prisma.$transaction([
      ...clampedAnswers.map((a) =>
        prisma.submissionAnswer.updateMany({
          where: { SubmissionID: submissionId, QuestionID: a.questionId },
          data: {
            ScoreAwarded: a.score,
            Feedback: a.comment,
            GradedByID: userId,
            GradedAt: new Date(),
          },
        })
      ),
    ]);

    const grade = await prisma.grade.upsert({
      where: { SubmissionID: submissionId },
      create: {
        SubmissionID: submissionId,
        FinalizedByID: userId,
        TotalScore: totalScore,
        MaxPossibleScore: maxPossibleScore,
        OverallFeedback: String(overallFeedback ?? "").trim().slice(0, 3000) || null,
        Status: "COMPLETE",
        FinalizedAt: new Date(),
      },
      update: {
        FinalizedByID: userId,
        TotalScore: totalScore,
        MaxPossibleScore: maxPossibleScore,
        OverallFeedback: String(overallFeedback ?? "").trim().slice(0, 3000) || null,
        Status: "COMPLETE",
        FinalizedAt: new Date(),
      },
    });

    return NextResponse.json({
      answers: clampedAnswers.map((a) => ({ questionId: a.questionId, score: a.score, comment: a.comment })),
      GradeID: grade.GradeID,
      TotalScore: grade.TotalScore,
      MaxPossibleScore: grade.MaxPossibleScore,
      OverallFeedback: grade.OverallFeedback,
    });
  } catch (err) {
    console.error("Publish grade error:", err);
    return NextResponse.json({ error: "Failed to publish grade." }, { status: 500 });
  }
}