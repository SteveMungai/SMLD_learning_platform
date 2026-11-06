"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { prepareNoteContent } from "@/lib/notes";
import { canManageCohort, NOT_IN_COHORT, type Role } from "@/lib/access";

type Result = { error: string | null };

// Staff only, and a lecturer only in a cohort an admin has added them to (admins: any cohort).
async function authorize(cohortId?: string): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return "Not authenticated.";
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") return "Only instructors can do this.";
  if (cohortId && !(await canManageCohort({ id: user.id, role: user.role as Role }, cohortId))) return NOT_IN_COHORT;
  return null;
}

async function authorizeCourse(courseId: string): Promise<string | null> {
  const course = await prisma.course.findUnique({ where: { CourseID: courseId }, select: { CohortID: true } });
  return course ? authorize(course.CohortID) : "Course not found.";
}
async function authorizeLesson(lessonId: string): Promise<string | null> {
  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId }, select: { course: { select: { CohortID: true } } } });
  return lesson ? authorize(lesson.course.CohortID) : "Lesson not found.";
}
async function authorizeNote(noteId: string): Promise<string | null> {
  const note = await prisma.note.findUnique({ where: { NoteID: noteId }, select: { lesson: { select: { course: { select: { CohortID: true } } } } } });
  return note ? authorize(note.lesson.course.CohortID) : "That note no longer exists.";
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
  const denied = await authorizeLesson(lessonId);
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

/** Add notes to a lesson: written content (formatted), a downloadable file link, or both. */
export async function addNote(lessonId: string, input: { title: string; content: string; url: string }): Promise<Result> {
  const denied = await authorizeLesson(lessonId);
  if (denied) return { error: denied };

  const title = input.title.trim();
  const url = input.url.trim();
  const prepared = prepareNoteContent(input.content);
  if (prepared.error) return { error: prepared.error };
  if (!title) return { error: "Give the notes a title." };
  if (!prepared.content && !url) return { error: "Write the notes, add a file link, or both." };

  let fileLink: string | null = null;
  if (url) {
    const parsed = httpUrl(url);
    if (typeof parsed === "string") return { error: parsed };
    fileLink = parsed.toString();
  }

  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId } });
  if (!lesson) return { error: "Lesson not found." };

  await prisma.note.create({ data: { LessonID: lessonId, Title: title, Content: prepared.content, FileLink: fileLink } });

  refresh();
  return { error: null };
}

/** Change an existing note's title, text or file link. */
export async function updateNote(noteId: string, input: { title: string; content: string; url: string }): Promise<Result> {
  const denied = await authorizeNote(noteId);
  if (denied) return { error: denied };

  const title = input.title.trim();
  const url = input.url.trim();
  const prepared = prepareNoteContent(input.content);
  if (prepared.error) return { error: prepared.error };
  if (!title) return { error: "Give the notes a title." };
  if (!prepared.content && !url) return { error: "Write the notes, add a file link, or both." };

  let fileLink: string | null = null;
  if (url) {
    const parsed = httpUrl(url);
    if (typeof parsed === "string") return { error: parsed };
    fileLink = parsed.toString();
  }

  const existing = await prisma.note.findUnique({ where: { NoteID: noteId } });
  if (!existing) return { error: "That note no longer exists." };

  await prisma.note.update({ where: { NoteID: noteId }, data: { Title: title, Content: prepared.content, FileLink: fileLink } });

  refresh();
  return { error: null };
}

export async function deleteNote(noteId: string): Promise<Result> {
  const denied = await authorizeNote(noteId);
  if (denied) return { error: denied };
  await prisma.note.deleteMany({ where: { NoteID: noteId } });
  refresh();
  return { error: null };
}

/** A cohort needs a course before it can have lessons. Lecturers can create one in their own cohorts. */
export async function createCourse(input: { cohortId: string; title: string }): Promise<Result> {
  const denied = await authorize(input.cohortId);
  if (denied) return { error: denied };

  const title = input.title.trim().replace(/\s+/g, " ");
  if (title.length < 2) return { error: "Give the course a title." };
  if (title.length > 120) return { error: "That title is too long (120 characters maximum)." };

  const cohort = await prisma.cohort.findUnique({ where: { CohortID: input.cohortId }, select: { CohortID: true } });
  if (!cohort) return { error: "Cohort not found." };
  const duplicate = await prisma.course.findFirst({ where: { CohortID: cohort.CohortID, Title: { equals: title, mode: "insensitive" } }, select: { CourseID: true } });
  if (duplicate) return { error: "This cohort already has a course with that title." };

  await prisma.course.create({ data: { CohortID: cohort.CohortID, Title: title } });
  refresh();
  revalidatePath("/admin", "layout");
  return { error: null };
}

export async function addLesson(input: { courseId: string; title: string }): Promise<Result> {
  const denied = await authorizeCourse(input.courseId);
  if (denied) return { error: denied };

  const title = input.title.trim().replace(/\s+/g, " ");
  if (title.length < 2) return { error: "Give the lesson a title." };
  if (title.length > 120) return { error: "That title is too long (120 characters maximum)." };

  const course = await prisma.course.findUnique({ where: { CourseID: input.courseId } });
  if (!course) return { error: "Course not found." };

  // Remember who added the lesson so their name can be shown on it.
  const session = await getServerSession(authOptions);
  const creatorId = session?.user?.id ?? null;

  // New lessons go to the end of the course.
  const last = await prisma.lesson.aggregate({ where: { CourseID: course.CourseID }, _max: { SequenceOrder: true } });
  await prisma.lesson.create({
    data: { CourseID: course.CourseID, Title: title, SequenceOrder: (last._max.SequenceOrder ?? 0) + 1, CreatedByID: creatorId },
  });

  refresh();
  return { error: null };
}
