"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Result = { error: string | null };

async function authorize(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return "Not authenticated.";
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") return "Only instructors can do this.";
  return null;
}

function refresh() {
  revalidatePath("/instructor/notes");
  revalidatePath("/notes");
}

export async function addMaterial(
  lessonId: string,
  type: "VIDEO" | "NOTES",
  title: string,
  url: string
): Promise<Result> {
  const denied = await authorize();
  if (denied) return { error: denied };

  const cleanTitle = title.trim();
  const cleanUrl = url.trim();
  if (!cleanTitle || !cleanUrl) return { error: "Title and link are required." };

  let parsed: URL;
  try {
    parsed = new URL(cleanUrl);
  } catch {
    return { error: "That link isn't a valid URL." };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: "Links must start with http or https." };
  }

  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId } });
  if (!lesson) return { error: "Lesson not found." };

  if (type === "VIDEO") {
    if (!getYouTubeEmbedUrl(cleanUrl)) return { error: "Use a YouTube link." };
    await prisma.video.upsert({
      where: { LessonID: lessonId },
      create: { LessonID: lessonId, Title: cleanTitle, YoutubeLink: cleanUrl },
      update: { Title: cleanTitle, YoutubeLink: cleanUrl },
    });
  } else {
    await prisma.note.create({
      data: { LessonID: lessonId, Title: cleanTitle, FileLink: cleanUrl },
    });
  }

  refresh();
  return { error: null };
}

export async function postAssignment(input: {
  lessonId: string;
  title: string;
  description: string;
  dueDate: string;
  questions: { text: string; maxScore: number; type: "SHORT_ANSWER" | "ESSAY" }[];
}): Promise<Result> {
  const denied = await authorize();
  if (denied) return { error: denied };

  const title = input.title.trim();
  const due = new Date(input.dueDate);

  if (!title || Number.isNaN(due.getTime())) return { error: "Title and due date are required." };
  if (due.getTime() <= Date.now()) return { error: "The due date must be in the future." };
  if (input.questions.length === 0) return { error: "Add at least one question." };

  const cleaned = [];
  for (let i = 0; i < input.questions.length; i++) {
    const q = input.questions[i];
    const text = q.text.trim();
    if (!text || !Number.isFinite(q.maxScore) || q.maxScore <= 0) {
      return { error: `Question ${i + 1} needs text and a score above 0.` };
    }
    cleaned.push({
      QuestionText: text,
      SequenceOrder: i + 1,
      QuestionType: q.type,
      MaxScore: q.maxScore,
    });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { LessonID: input.lessonId },
    include: { course: true, assignments: { select: { AssignmentID: true, Status: true } } },
  });
  if (!lesson) return { error: "Lesson not found." };
  if (lesson.assignments.some((a) => a.Status === "DRAFT")) {
    return { error: "This lesson has a draft assignment. Finish and publish it from the Questions page." };
  }
  if (lesson.assignments.length > 0) return { error: "This lesson already has an assignment." };

  await prisma.assignment.create({
    data: {
      LessonID: lesson.LessonID,
      CohortID: lesson.course.CohortID,
      Title: title,
      Description: input.description.trim() || null,
      DeadlineDate: due,
      Status: "PUBLISHED",
      MaxScore: cleaned.reduce((sum, q) => sum + q.MaxScore, 0),
      questions: { create: cleaned },
    },
  });

  refresh();
  return { error: null };
}