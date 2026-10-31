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
  revalidatePath("/lessons", "layout");
}

function httpUrl(raw: string): URL | string {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return "That link isn't a valid URL.";
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "Links must start with http or https.";
  return parsed;
}

/** Add or replace the lesson's teaching video (one per lesson). */
export async function addVideo(lessonId: string, title: string, url: string): Promise<Result> {
  const denied = await authorize();
  if (denied) return { error: denied };

  const cleanTitle = title.trim();
  if (!cleanTitle || !url.trim()) return { error: "Title and link are required." };
  const parsed = httpUrl(url);
  if (typeof parsed === "string") return { error: parsed };
  if (!getYouTubeEmbedUrl(parsed.toString())) return { error: "Use a YouTube link." };

  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId } });
  if (!lesson) return { error: "Lesson not found." };

  await prisma.video.upsert({
    where: { LessonID: lessonId },
    create: { LessonID: lessonId, Title: cleanTitle, YoutubeLink: parsed.toString() },
    update: { Title: cleanTitle, YoutubeLink: parsed.toString() },
  });

  refresh();
  return { error: null };
}

/** Add notes to a lesson: written content, a downloadable file link, or both. */
export async function addNote(lessonId: string, input: { title: string; content: string; url: string }): Promise<Result> {
  const denied = await authorize();
  if (denied) return { error: denied };

  const title = input.title.trim();
  const content = input.content.trim();
  const url = input.url.trim();
  if (!title) return { error: "Give the notes a title." };
  if (!content && !url) return { error: "Write the notes, add a file link, or both." };
  if (content.length > 20000) return { error: "That's too long (20,000 characters maximum). Split it into two notes." };

  let fileLink: string | null = null;
  if (url) {
    const parsed = httpUrl(url);
    if (typeof parsed === "string") return { error: parsed };
    fileLink = parsed.toString();
  }

  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId } });
  if (!lesson) return { error: "Lesson not found." };

  await prisma.note.create({ data: { LessonID: lessonId, Title: title, Content: content || null, FileLink: fileLink } });

  refresh();
  return { error: null };
}

export async function addLesson(input: { courseId: string; title: string }): Promise<Result> {
  const denied = await authorize();
  if (denied) return { error: denied };

  const title = input.title.trim().replace(/\s+/g, " ");
  if (title.length < 2) return { error: "Give the lesson a title." };
  if (title.length > 120) return { error: "That title is too long (120 characters maximum)." };

  const course = await prisma.course.findUnique({ where: { CourseID: input.courseId } });
  if (!course) return { error: "Course not found." };

  // New lessons go to the end of the course.
  const last = await prisma.lesson.aggregate({ where: { CourseID: course.CourseID }, _max: { SequenceOrder: true } });
  await prisma.lesson.create({
    data: { CourseID: course.CourseID, Title: title, SequenceOrder: (last._max.SequenceOrder ?? 0) + 1 },
  });

  refresh();
  return { error: null };
}
