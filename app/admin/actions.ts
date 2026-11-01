"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { adminSession, logAdmin, ROLE_LABEL, type Result } from "@/lib/admin";

const DENIED: Result = { error: "Only admins can do this." };
const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
type RoleName = (typeof ROLES)[number];
const refresh = () => revalidatePath("/admin", "layout");
const nameOf = (u: { FullName: string | null; Email: string }) => u.FullName ?? u.Email;

/** Change someone's role. The person is signed out (TokenVersion bump) so the new role applies at next login. */
export async function setRole(userId: string, role: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  if (!ROLES.includes(role as RoleName)) return { error: "Unknown role." };
  if (userId === admin.id) return { error: "You can't change your own role." };

  const target = await prisma.user.findUnique({ where: { UserID: userId } });
  if (!target) return { error: "User not found." };
  if (target.Role === role) return { error: null, message: "No change." };
  if (target.Role === "ADMIN") {
    const admins = await prisma.user.count({ where: { Role: "ADMIN" } });
    if (admins <= 1) return { error: "That is the last admin. Make someone else an admin first." };
  }

  await prisma.user.update({ where: { UserID: userId }, data: { Role: role as RoleName, TokenVersion: { increment: 1 } } });
  await logAdmin(admin.id, `Role changed: ${nameOf(target)}, ${ROLE_LABEL[target.Role]} to ${ROLE_LABEL[role as RoleName]}`, "User", userId);
  refresh();
  return { error: null, message: "Role updated. They will be asked to sign in again." };
}

/** Add (active=true) or remove (active=false) a person from a cohort. Removing keeps their grades. */
export async function setMembership(userId: string, cohortId: string, active: boolean): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  const [user, cohort] = await Promise.all([
    prisma.user.findUnique({ where: { UserID: userId } }),
    prisma.cohort.findUnique({ where: { CohortID: cohortId } }),
  ]);
  if (!user || !cohort) return { error: "User or cohort not found." };

  await prisma.cohortMembership.upsert({
    where: { UserID_CohortID: { UserID: userId, CohortID: cohortId } },
    create: { UserID: userId, CohortID: cohortId, Status: active ? "ACTIVE" : "INACTIVE" },
    update: { Status: active ? "ACTIVE" : "INACTIVE" },
  });
  await logAdmin(admin.id, `${active ? "Member added" : "Member removed"}: ${nameOf(user)} ${active ? "to" : "from"} ${cohort.CohortName}`, "Cohort", cohortId);
  refresh();
  return { error: null };
}

export async function createCohort(name: string, year: string, description: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  if (!name.trim() || !year.trim()) return { error: "Name and academic year are required." };
  const cohort = await prisma.cohort.create({
    data: { CohortName: name.trim(), AcademicYear: year.trim(), Description: description.trim() || null },
  });
  await logAdmin(admin.id, `Cohort created: ${cohort.CohortName} (${cohort.AcademicYear})`, "Cohort", cohort.CohortID);
  refresh();
  return { error: null, id: cohort.CohortID };
}

export async function updateCohort(cohortId: string, name: string, year: string, description: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  if (!name.trim() || !year.trim()) return { error: "Name and academic year are required." };
  await prisma.cohort.update({
    where: { CohortID: cohortId },
    data: { CohortName: name.trim(), AcademicYear: year.trim(), Description: description.trim() || null },
  });
  await logAdmin(admin.id, `Cohort updated: ${name.trim()}`, "Cohort", cohortId);
  refresh();
  return { error: null, message: "Saved." };
}

/** Paste one or many emails (separated by spaces, commas or new lines). */
export async function addMembersByEmail(cohortId: string, text: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  const cohort = await prisma.cohort.findUnique({ where: { CohortID: cohortId } });
  if (!cohort) return { error: "Cohort not found." };

  const emails = [...new Set(text.toLowerCase().split(/[\s,;]+/).filter(Boolean))];
  if (emails.length === 0) return { error: "Enter at least one email." };
  const users = await prisma.user.findMany({ where: { Email: { in: emails } } });
  const found = new Set(users.map((u) => u.Email.toLowerCase()));

  for (const u of users) {
    await prisma.cohortMembership.upsert({
      where: { UserID_CohortID: { UserID: u.UserID, CohortID: cohortId } },
      create: { UserID: u.UserID, CohortID: cohortId, Status: "ACTIVE" },
      update: { Status: "ACTIVE" },
    });
  }
  if (users.length) await logAdmin(admin.id, `${users.length} member(s) added to ${cohort.CohortName}`, "Cohort", cohortId);
  refresh();
  const missing = emails.filter((e) => !found.has(e));
  return {
    error: null,
    message: `Added ${users.length}.${missing.length ? ` No account found for: ${missing.join(", ")}` : ""}`,
  };
}

export async function renameLesson(lessonId: string, title: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  if (!title.trim()) return { error: "Title can't be empty." };
  await prisma.lesson.update({ where: { LessonID: lessonId }, data: { Title: title.trim() } });
  await logAdmin(admin.id, `Lesson renamed: ${title.trim()}`, "Lesson", lessonId);
  refresh();
  revalidatePath("/lessons", "layout");
  return { error: null };
}

/** Swap a lesson with its neighbour in the same course. */
export async function moveLesson(lessonId: string, direction: "up" | "down"): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId } });
  if (!lesson) return { error: "Lesson not found." };
  const siblings = await prisma.lesson.findMany({ where: { CourseID: lesson.CourseID }, orderBy: { SequenceOrder: "asc" } });
  const i = siblings.findIndex((l) => l.LessonID === lessonId);
  const other = siblings[direction === "up" ? i - 1 : i + 1];
  if (!other) return { error: null };
  await prisma.$transaction([
    prisma.lesson.update({ where: { LessonID: lesson.LessonID }, data: { SequenceOrder: other.SequenceOrder } }),
    prisma.lesson.update({ where: { LessonID: other.LessonID }, data: { SequenceOrder: lesson.SequenceOrder } }),
  ]);
  await logAdmin(admin.id, `Lesson moved ${direction}: ${lesson.Title}`, "Lesson", lessonId);
  refresh();
  revalidatePath("/lessons", "layout");
  return { error: null };
}

/** lecturerId "" clears the recorded lecturer. */
export async function setLessonLecturer(lessonId: string, lecturerId: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  let who = "none";
  if (lecturerId) {
    const lecturer = await prisma.user.findUnique({ where: { UserID: lecturerId } });
    if (!lecturer || lecturer.Role === "STUDENT") return { error: "Pick a lecturer or admin." };
    who = nameOf(lecturer);
  }
  const lesson = await prisma.lesson.update({ where: { LessonID: lessonId }, data: { CreatedByID: lecturerId || null } });
  await logAdmin(admin.id, `Lecturer changed: ${lesson.Title} is now ${who}`, "Lesson", lessonId);
  refresh();
  revalidatePath("/lessons", "layout");
  return { error: null };
}

/** The title must be typed back exactly: deleting a lesson removes its submissions and grades too. */
export async function deleteLesson(lessonId: string, confirmTitle: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  const lesson = await prisma.lesson.findUnique({ where: { LessonID: lessonId } });
  if (!lesson) return { error: "Lesson not found." };
  if (confirmTitle.trim() !== lesson.Title) return { error: "The title doesn't match." };
  await prisma.lesson.delete({ where: { LessonID: lessonId } });
  await logAdmin(admin.id, `Lesson deleted: ${lesson.Title}`, "Lesson", lessonId);
  refresh();
  revalidatePath("/lessons", "layout");
  return { error: null };
}
