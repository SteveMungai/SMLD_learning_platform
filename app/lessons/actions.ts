"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { prepareNoteContent } from "@/lib/notes";
import { canManageCohort, currentActor, NOT_IN_COHORT, type Role } from "@/lib/access";
import { logAdmin } from "@/lib/admin";
import { renumberLessons } from "@/lib/lessons";

type Result = { error: string | null; id?: string };

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

/** Add notes to a lesson: formatted text, a PDF (uploaded separately), or both. Returns the new note's id. */
export async function addNote(lessonId: string, input: { title: string; content: string; hasFile: boolean }): Promise<Result> {
  const denied = await authorizeLesson(lessonId);
  if (denied) return { error: denied };

  const title = input.title.trim();
  const prepared = prepareNoteContent(input.content);
  if (prepared.error) return { error: prepared.error };
  if (!title) return { error: "Give the notes a title." };
  if (!prepared.content && !input.hasFile) return { error: "Write the notes, attach a PDF, or both." };

  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId } });
  if (!lesson) return { error: "Lesson not found." };

  const note = await prisma.note.create({ data: { LessonID: lessonId, Title: title, Content: prepared.content }, select: { NoteID: true } });

  refresh();
  return { error: null, id: note.NoteID };
}

/** Change an existing note's title or text. (Its PDF is attached, replaced or removed separately.) */
export async function updateNote(noteId: string, input: { title: string; content: string; hasFile: boolean }): Promise<Result> {
  const denied = await authorizeNote(noteId);
  if (denied) return { error: denied };

  const title = input.title.trim();
  const prepared = prepareNoteContent(input.content);
  if (prepared.error) return { error: prepared.error };
  if (!title) return { error: "Give the notes a title." };
  if (!prepared.content && !input.hasFile) return { error: "Write the notes, attach a PDF, or both." };

  const existing = await prisma.note.findUnique({ where: { NoteID: noteId } });
  if (!existing) return { error: "That note no longer exists." };

  await prisma.note.update({ where: { NoteID: noteId }, data: { Title: title, Content: prepared.content } });

  refresh();
  return { error: null, id: noteId };
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

// ───────────── Rename and delete courses and lessons ─────────────
// A lecturer can do this in the cohorts they have been added to, an admin in any cohort. Deleting asks
// for the title to be typed back, because it also removes everything inside (notes, videos, assignments,
// and students' submissions and grades). Every change is written to the activity log.

function refreshAll() {
  refresh();
  revalidatePath("/admin", "layout");
}

export async function renameCourse(courseId: string, title: string): Promise<Result> {
  const denied = await authorizeCourse(courseId);
  if (denied) return { error: denied };
  const clean = title.trim().replace(/\s+/g, " ");
  if (clean.length < 2) return { error: "Give the course a title." };
  if (clean.length > 120) return { error: "That title is too long (120 characters maximum)." };

  const course = await prisma.course.findUnique({ where: { CourseID: courseId }, select: { CohortID: true, Title: true } });
  if (!course) return { error: "Course not found." };
  const duplicate = await prisma.course.findFirst({
    where: { CohortID: course.CohortID, Title: { equals: clean, mode: "insensitive" }, NOT: { CourseID: courseId } },
    select: { CourseID: true },
  });
  if (duplicate) return { error: "This cohort already has a course with that title." };

  await prisma.course.update({ where: { CourseID: courseId }, data: { Title: clean } });
  const me = await currentActor();
  if (me) await logAdmin(me.id, `Course renamed: "${course.Title}" to "${clean}"`, "Course", courseId);
  refreshAll();
  return { error: null };
}

export async function deleteCourse(courseId: string, confirmTitle: string): Promise<Result> {
  const denied = await authorizeCourse(courseId);
  if (denied) return { error: denied };
  const course = await prisma.course.findUnique({ where: { CourseID: courseId }, select: { Title: true } });
  if (!course) return { error: null };
  if (confirmTitle.trim() !== course.Title) return { error: "The title doesn't match." };

  await prisma.course.delete({ where: { CourseID: courseId } });
  const me = await currentActor();
  if (me) await logAdmin(me.id, `Course deleted: ${course.Title}`, "Course", courseId);
  refreshAll();
  return { error: null };
}

export async function renameLesson(lessonId: string, title: string): Promise<Result> {
  const denied = await authorizeLesson(lessonId);
  if (denied) return { error: denied };
  const clean = title.trim().replace(/\s+/g, " ");
  if (!clean) return { error: "Give the lesson a title." };
  if (clean.length > 150) return { error: "That title is too long (150 characters maximum)." };

  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId }, select: { Title: true } });
  if (!lesson) return { error: "Lesson not found." };
  await prisma.lesson.update({ where: { LessonID: lessonId }, data: { Title: clean } });
  const me = await currentActor();
  if (me) await logAdmin(me.id, `Lesson renamed: "${lesson.Title}" to "${clean}"`, "Lesson", lessonId);
  refreshAll();
  return { error: null };
}

export async function deleteLesson(lessonId: string, confirmTitle: string): Promise<Result> {
  const denied = await authorizeLesson(lessonId);
  if (denied) return { error: denied };
  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId }, select: { Title: true, CourseID: true } });
  if (!lesson) return { error: null };
  if (confirmTitle.trim() !== lesson.Title) return { error: "The title doesn't match." };

  await prisma.lesson.delete({ where: { LessonID: lessonId } });
  await renumberLessons(lesson.CourseID); // later lessons move up
  const me = await currentActor();
  if (me) await logAdmin(me.id, `Lesson deleted: ${lesson.Title}`, "Lesson", lessonId);
  refreshAll();
  return { error: null };
}
