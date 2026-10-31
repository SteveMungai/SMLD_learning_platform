import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_TYPES, MAX_FILES, MAX_TOTAL_BYTES, checkFile, cleanFileName, extOf, formatSize, matchesSignature } from "@/lib/attachments";

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

  const pastDeadline = !!assignment.DeadlineDate && new Date() > assignment.DeadlineDate;
  if (pastDeadline && !assignment.AcceptLate) {
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
  return { assignment, pastDeadline };
}

function parseAnswers(raw: unknown): AnswerInput[] {
  if (!Array.isArray(raw)) throw new ApiError("Malformed answers payload.", 400);
  return raw.map((a) => ({
    questionId: String(a?.questionId ?? ""),
    answerText: String(a?.answerText ?? ""),
  }));
}

/** Final submission (multipart form: answers JSON + optional files). */
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

    let removeIds: string[] = [];
    try {
      const raw = formData.get("removeAttachmentIds");
      if (raw) removeIds = (JSON.parse(String(raw)) as unknown[]).map(String);
    } catch {
      throw new ApiError("Malformed attachment list.", 400);
    }

    const { pastDeadline } = await loadOpenAssignment(assignmentId, userId, answers);

    const where = { AssignmentID_StudentID: { AssignmentID: assignmentId, StudentID: userId } };
    const existing = await prisma.submission.findUnique({
      where,
      include: { grade: true, attachments: { select: { AttachmentID: true } } },
    });
    if (existing?.grade?.Status === "COMPLETE") {
      throw new ApiError("This submission has already been graded.", 409);
    }

    // ── Validate uploaded files before touching the database ──
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const keptCount = (existing?.attachments ?? []).filter((a) => !removeIds.includes(a.AttachmentID)).length;
    if (keptCount + files.length > MAX_FILES) {
      throw new ApiError(`You can attach at most ${MAX_FILES} files.`, 400);
    }
    if (files.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) {
      throw new ApiError(`Files are too large — keep new uploads under ${formatSize(MAX_TOTAL_BYTES)} in total.`, 400);
    }
    const prepared: { name: string; ext: string; bytes: Uint8Array<ArrayBuffer> }[] = [];
    for (const f of files) {
      const problem = checkFile(f.name, f.size);
      if (problem) throw new ApiError(problem, 400);
      const bytes = new Uint8Array(await f.arrayBuffer());
      const ext = extOf(f.name);
      if (!matchesSignature(ext, bytes.subarray(0, 8))) {
        throw new ApiError(`"${f.name}" doesn't look like a real .${ext} file.`, 400);
      }
      prepared.push({ name: cleanFileName(f.name), ext, bytes });
    }

    const answerRows = answers.map((a) => ({ QuestionID: a.questionId, AnswerText: a.answerText }));
    const status = pastDeadline ? ("LATE" as const) : ("SUBMITTED" as const);

    const submission = await prisma.$transaction(async (tx) => {
      const saved = await tx.submission.upsert({
        where,
        create: {
          AssignmentID: assignmentId,
          StudentID: userId,
          SubmittedAt: new Date(),
          Status: status,
          ReceiptCode: newReceiptCode(),
          answers: { create: answerRows },
        },
        update: {
          SubmittedAt: new Date(),
          Status: status,
          // A draft has no receipt yet; a resubmission keeps its original one.
          ReceiptCode: existing?.ReceiptCode ?? newReceiptCode(),
          answers: { deleteMany: {}, create: answerRows },
        },
      });

      if (removeIds.length) {
        // Scoped to this submission, so a student can't delete someone else's file by ID.
        await tx.attachment.deleteMany({ where: { SubmissionID: saved.SubmissionID, AttachmentID: { in: removeIds } } });
      }
      for (const f of prepared) {
        const id = randomUUID();
        await tx.attachment.create({
          data: {
            AttachmentID: id,
            SubmissionID: saved.SubmissionID,
            FileName: f.name,
            FileLink: `/api/attachments/${id}`,
            FileSizeKB: Math.max(1, Math.round(f.bytes.length / 1024)),
            ContentType: ALLOWED_TYPES[f.ext],
            file: { create: { Data: f.bytes } },
          },
        });
      }
      return saved;
    });

    const attachments = await prisma.attachment.findMany({
      where: { SubmissionID: submission.SubmissionID },
      orderBy: { DateUploaded: "asc" },
      select: { AttachmentID: true, FileName: true, FileSizeKB: true, ContentType: true },
    });

    return NextResponse.json({
      ReceiptCode: submission.ReceiptCode,
      SubmittedAt: submission.SubmittedAt?.toISOString() ?? null,
      Status: submission.Status,
      attachments,
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
