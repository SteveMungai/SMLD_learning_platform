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
  if (role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can submit assignments." }, { status: 403 });
  }

  const formData = await req.formData();
  const assignmentId = formData.get("assignmentId") as string | null;
  const answersRaw = formData.get("answers") as string | null;

  if (!assignmentId || !answersRaw) {
    return NextResponse.json({ error: "Missing assignmentId or answers." }, { status: 400 });
  }

  let answers: { questionId: string; answerText: string }[];
  try {
    answers = JSON.parse(answersRaw);
  } catch {
    return NextResponse.json({ error: "Malformed answers payload." }, { status: 400 });
  }

  // TODO: handle file uploads (formData.getAll("files")) — wire to your storage
  // provider (e.g. Supabase Storage) and create Attachment rows with the
  // resulting URLs. 

  const receiptCode = `SMLD-${Date.now().toString(36).toUpperCase()}`;

  try {
    const submission = await prisma.submission.upsert({
      where: {
        AssignmentID_StudentID: { AssignmentID: assignmentId, StudentID: userId },
      },
      create: {
        AssignmentID: assignmentId,
        StudentID: userId,
        SubmittedAt: new Date(),
        Status: "SUBMITTED",
        ReceiptCode: receiptCode,
        answers: {
          create: answers.map((a) => ({
            QuestionID: a.questionId,
            AnswerText: a.answerText,
          })),
        },
      },
      update: {
        SubmittedAt: new Date(),
        Status: "SUBMITTED",
        answers: {
          deleteMany: {},
          create: answers.map((a) => ({
            QuestionID: a.questionId,
            AnswerText: a.answerText,
          })),
        },
      },
    });

    return NextResponse.json({ ReceiptCode: submission.ReceiptCode });
  } catch (err) {
    console.error("Submission error:", err);
    return NextResponse.json({ error: "Failed to save submission." }, { status: 500 });
  }
}