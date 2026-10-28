import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AnswerInput = { questionId: string; answerText: string };

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function fail(err: unknown, label: string) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(label, err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

function newReceiptCode() {
  return `SMLD-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

async function requireStudent() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) throw new ApiError("Not authenticated.", 401);
  if (session.user.role !== "STUDENT") throw new ApiError("Only students can submit assignments.", 403);
  return userId;
}

/** Shared checks for saving a draft and for submitting. */
async function loadOpenAssignment(assignmentId: string, userId: string, answers: AnswerInput[]) {
  const assignment = await prisma.assignment.findUnique({
    where: { AssignmentID: assignmentId },
    include: { questions: { select: { QuestionID: true } } },
  });
  // Drafts belong to the lecturer; to a student they simply don't exist.
  if (!assignment || assignment.Status !== "PUBLISHED") throw new ApiError("Assignment not found.", 404);

  if (assignment.DeadlineDate && new Date() > assignment.DeadlineDate) {
    throw new ApiError("The deadline has passed.", 403);
  }

  const membership = await prisma.cohortMembership.findFirst({
    where: { UserID: userId, CohortID: assignment.CohortID, Status: "ACTIVE" },
  });
  if (!membership) throw new ApiError("This assignment isn't for your cohort.", 403);

  const validIds = new Set(assignment.questions.map((q) => q.QuestionID));
  if (answers.some((a) => !validIds.has(a.questionId))) {
    throw new ApiError("Answers don't match this assignment.", 400);
  }
  return assignment;
}

function parseAnswers(raw: unknown): AnswerInput[] {
  if (!Array.isArray(raw)) throw new ApiError("Malformed answers payload.", 400);
  return raw.map((a) => ({
    questionId: String(a?.questionId ?? ""),
    answerText: String(a?.answerText ?? ""),
  }));
}

/** Final submission (multipart form, so file attachments can be added later). */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireStudent();

    const formData = await req.formData();
    const assignmentId = formData.get("assignmentId") as string | null;
    const answersRaw = formData.get("answers") as string | null;
    if (!assignmentId || !answersRaw) throw new ApiError("Missing assignmentId or answers.", 400);

    let answers: AnswerInput[];
    try {
      answers = parseAnswers(JSON.parse(answersRaw));
    } catch (e) {
      throw e instanceof ApiError ? e : new ApiError("Malformed answers payload.", 400);
    }

    await loadOpenAssignment(assignmentId, userId, answers);

    const where = { AssignmentID_StudentID: { AssignmentID: assignmentId, StudentID: userId } };
    const existing = await prisma.submission.findUnique({ where, include: { grade: true } });
    if (existing?.grade?.Status === "COMPLETE") {
      throw new ApiError("This submission has already been graded.", 409);
    }

    // TODO: handle file uploads (formData.getAll("files")) — wire to your storage
    // provider and create Attachment rows with the resulting URLs.

    const answerRows = answers.map((a) => ({ QuestionID: a.questionId, AnswerText: a.answerText }));
    const submission = await prisma.submission.upsert({
      where,
      create: {
        AssignmentID: assignmentId,
        StudentID: userId,
        SubmittedAt: new Date(),
        Status: "SUBMITTED",
        ReceiptCode: newReceiptCode(),
        answers: { create: answerRows },
      },
      update: {
        SubmittedAt: new Date(),
        Status: "SUBMITTED",
        // A draft has no receipt yet; a resubmission keeps its original one.
        ReceiptCode: existing?.ReceiptCode ?? newReceiptCode(),
        answers: { deleteMany: {}, create: answerRows },
      },
    });

    return NextResponse.json({
      ReceiptCode: submission.ReceiptCode,
      SubmittedAt: submission.SubmittedAt?.toISOString() ?? null,
    });
  } catch (err) {
    return fail(err, "Submission error:");
  }
}

/** Autosave / "Save draft" — stores answers without submitting. */
export async function PUT(req: NextRequest) {
  try {
    const userId = await requireStudent();

    let body: { assignmentId?: string; answers?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new ApiError("Malformed request.", 400);
    }
    if (!body.assignmentId) throw new ApiError("Missing assignmentId.", 400);
    const answers = parseAnswers(body.answers);

    await loadOpenAssignment(body.assignmentId, userId, answers);

    await prisma.$transaction(async (tx) => {
      const where = { AssignmentID_StudentID: { AssignmentID: body.assignmentId!, StudentID: userId } };
      const current = await tx.submission.findUnique({ where });
      // Never let an autosave overwrite something already handed in.
      if (current && current.Status !== "DRAFT") {
        throw new ApiError("You've already submitted this assignment.", 409);
      }
      const submission =
        current ??
        (await tx.submission.create({
          data: { AssignmentID: body.assignmentId!, StudentID: userId, Status: "DRAFT" },
        }));

      for (const a of answers) {
        await tx.submissionAnswer.upsert({
          where: { SubmissionID_QuestionID: { SubmissionID: submission.SubmissionID, QuestionID: a.questionId } },
          create: { SubmissionID: submission.SubmissionID, QuestionID: a.questionId, AnswerText: a.answerText },
          update: { AnswerText: a.answerText },
        });
      }
    });

    return NextResponse.json({ savedAt: new Date().toISOString() });
  } catch (err) {
    return fail(err, "Draft save error:");
  }
}
