"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { adminSession, logAdmin, ROLE_LABEL, type Result } from "@/lib/admin";
import { renumberLessons } from "@/lib/lessons";
import { formatJoinCode, uniqueJoinCode } from "@/lib/joinCodes";
import { fromEat } from "@/lib/updates";

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
  await renumberLessons(lesson.CourseID); // later lessons move up: delete lesson 1 and lesson 2 becomes lesson 1
  await logAdmin(admin.id, `Lesson deleted: ${lesson.Title}`, "Lesson", lessonId);
  refresh();
  revalidatePath("/lessons", "layout");
  return { error: null };
}

// ───────────── Cohort join link ─────────────
// A cohort's code lets a student join (and new people register straight into it). Switching it off,
// replacing it or letting it expire stops the old link working. It never gives a role, only a
// student membership.

async function cohortForJoin(cohortId: string) {
  return prisma.cohort.findUnique({ where: { CohortID: cohortId }, select: { CohortID: true, CohortName: true, JoinCode: true } });
}

/** Switch joining by code on. Keeps the current code if there is one. */
export async function enableJoinCode(cohortId: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  const cohort = await cohortForJoin(cohortId);
  if (!cohort) return { error: "Cohort not found." };
  if (cohort.JoinCode) return { error: null };
  const code = await uniqueJoinCode();
  await prisma.cohort.update({ where: { CohortID: cohortId }, data: { JoinCode: code, JoinCodeExpiresAt: null } });
  await logAdmin(admin.id, `Join link turned on: ${cohort.CohortName}`, "Cohort", cohortId);
  refresh();
  return { error: null, message: `The code is ${formatJoinCode(code)}.` };
}

/** A new code. The old link stops working straight away. */
export async function replaceJoinCode(cohortId: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  const cohort = await cohortForJoin(cohortId);
  if (!cohort) return { error: "Cohort not found." };
  const code = await uniqueJoinCode();
  await prisma.cohort.update({ where: { CohortID: cohortId }, data: { JoinCode: code, JoinCodeExpiresAt: null } });
  await logAdmin(admin.id, `Join code replaced: ${cohort.CohortName}`, "Cohort", cohortId);
  refresh();
  return { error: null, message: `New code: ${formatJoinCode(code)}. The old link no longer works.` };
}

export async function disableJoinCode(cohortId: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  const cohort = await cohortForJoin(cohortId);
  if (!cohort) return { error: "Cohort not found." };
  await prisma.cohort.update({ where: { CohortID: cohortId }, data: { JoinCode: null, JoinCodeExpiresAt: null } });
  await logAdmin(admin.id, `Join link turned off: ${cohort.CohortName}`, "Cohort", cohortId);
  refresh();
  return { error: null };
}

/** day is "YYYY-MM-DD" (Nairobi); the code stops working at the end of that day. "" means no expiry. */
export async function setJoinExpiry(cohortId: string, day: string): Promise<Result> {
  const admin = await adminSession();
  if (!admin) return DENIED;
  const cohort = await cohortForJoin(cohortId);
  if (!cohort) return { error: "Cohort not found." };
  if (!cohort.JoinCode) return { error: "Turn the join link on first." };
  let expires: Date | null = null;
  if (day) {
    expires = fromEat(day, "23:59");
    if (!expires) return { error: "That date isn't valid." };
    if (expires <= new Date()) return { error: "Choose a date that hasn't passed yet." };
  }
  await prisma.cohort.update({ where: { CohortID: cohortId }, data: { JoinCodeExpiresAt: expires } });
  await logAdmin(admin.id, `Join link ${expires ? `set to expire on ${day}` : "expiry cleared"}: ${cohort.CohortName}`, "Cohort", cohortId);
  refresh();
  return { error: null, message: expires ? `The code stops working at the end of ${day}.` : "The code no longer expires." };
}
