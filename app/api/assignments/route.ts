import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type IncomingQuestion = {
  id?: string | null;
  QuestionText?: string;
  QuestionType?: string;
  MaxScore?: number;
};

/**
 * Create or update the assignment (questions + deadline) for ONE lesson.
 *
 *  - publish: false → saves as a DRAFT (used by autosave / "Save draft"). Drafts
 *    may be incomplete and are invisible to students.
 *  - publish: true  → validates and makes it visible to the lesson's cohort.
 *    Also used to push edits to an already-published assignment.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "INSTRUCTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only lecturers can set questions." }, { status: 403 });
  }

  let body: {
    lessonId?: string;
    title?: string;
    description?: string;
    deadlineDate?: string | null;
    questions?: IncomingQuestion[];
    publish?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { lessonId, publish = false } = body;
  if (!lessonId || !Array.isArray(body.questions)) {
    return NextResponse.json({ error: "Missing lessonId or questions." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim() || null;
  const deadline = body.deadlineDate ? new Date(body.deadlineDate) : null;
  if (deadline && Number.isNaN(deadline.getTime())) {
    return NextResponse.json({ error: "That deadline isn't a valid date." }, { status: 400 });
  }

  const questions = body.questions.map((q, i) => ({
    id: q.id || null,
    QuestionText: (q.QuestionText ?? "").trim(),
    QuestionType: q.QuestionType === "ESSAY" ? ("ESSAY" as const) : ("SHORT_ANSWER" as const),
    MaxScore: Math.max(0, Number(q.MaxScore) || 0),
    SequenceOrder: i + 1,
  }));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.findUnique({
        where: { LessonID: lessonId },
        include: { course: { select: { CohortID: true } } },
      });
      if (!lesson) throw new ApiError("Lesson not found.", 404);

      const existing = await tx.assignment.findFirst({
        where: { LessonID: lessonId },
        include: { questions: { select: { QuestionID: true, _count: { select: { answers: true } } } } },
      });

      if (existing?.Status === "PUBLISHED" && !publish) {
        throw new ApiError("This assignment is already published, so it can't be saved as a draft.", 409);
      }

      if (publish) {
        if (!title) throw new ApiError("Add a title before publishing.", 400);
        if (!deadline) throw new ApiError("Set a deadline before publishing.", 400);
        // A deadline in the past only blocks the moment of first publishing.
        if (existing?.Status !== "PUBLISHED" && deadline.getTime() <= Date.now()) {
          throw new ApiError("The deadline must be in the future.", 400);
        }
        if (questions.length === 0) throw new ApiError("Add at least one question.", 400);
        const bad = questions.findIndex((q) => !q.QuestionText || q.MaxScore <= 0);
        if (bad !== -1) throw new ApiError(`Question ${bad + 1} needs text and a score above 0.`, 400);
      }

      // Questions that already exist on THIS assignment are updated in place so student
      // answers (which reference QuestionID) are never lost. Unknown ids become new rows.
      const existingIds = new Map((existing?.questions ?? []).map((q) => [q.QuestionID, q._count.answers]));
      const keptIds = new Set(questions.map((q) => q.id).filter((id): id is string => !!id && existingIds.has(id)));
      const removed = [...existingIds.entries()].filter(([id]) => !keptIds.has(id));
      if (removed.some(([, answerCount]) => answerCount > 0)) {
        throw new ApiError("Students have already answered a question you removed. Questions with answers can't be deleted.", 409);
      }

      const maxScore = questions.reduce((sum, q) => sum + q.MaxScore, 0);
      const data = {
        Title: title,
        Description: description,
        DeadlineDate: deadline,
        Status: publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
        MaxScore: maxScore,
      };

      const assignment = existing
        ? await tx.assignment.update({ where: { AssignmentID: existing.AssignmentID }, data })
        : await tx.assignment.create({ data: { ...data, LessonID: lesson.LessonID, CohortID: lesson.course.CohortID } });

      if (removed.length) {
        await tx.question.deleteMany({ where: { QuestionID: { in: removed.map(([id]) => id) } } });
      }

      for (const q of questions) {
        const fields = {
          QuestionText: q.QuestionText,
          QuestionType: q.QuestionType,
          MaxScore: q.MaxScore,
          SequenceOrder: q.SequenceOrder,
        };
        if (q.id && existingIds.has(q.id)) {
          await tx.question.update({ where: { QuestionID: q.id }, data: fields });
        } else {
          await tx.question.create({ data: { ...fields, AssignmentID: assignment.AssignmentID } });
        }
      }

      const saved = await tx.question.findMany({
        where: { AssignmentID: assignment.AssignmentID },
        orderBy: { SequenceOrder: "asc" },
      });
      return { assignment, saved };
    });

    return NextResponse.json({
      AssignmentID: result.assignment.AssignmentID,
      Status: result.assignment.Status,
      // Lets the client learn the real IDs of questions it just created.
      questions: result.saved.map((q) => ({ QuestionID: q.QuestionID, SequenceOrder: q.SequenceOrder })),
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Assignment save error:", err);
    return NextResponse.json({ error: "Failed to save the assignment." }, { status: 500 });
  }
}
