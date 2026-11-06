import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Who may work in which cohort.
//   Admins    : every cohort.
//   Lecturers : only the cohorts an admin has added them to.
//   Students  : only the cohorts they belong to (and only to read).
// Every page, action and API route that lets a lecturer touch lessons, assignments or grades
// goes through these helpers, so the rule lives in one place.

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type Actor = { id: string; role: Role };

export const NOT_IN_COHORT = "You haven't been added to this cohort yet. Ask an admin to add you.";

export async function currentActor(): Promise<Actor | null> {
  const user = (await getServerSession(authOptions))?.user;
  return user?.id ? { id: user.id, role: user.role } : null;
}

/** Cohorts this person is an active member of. */
export async function memberCohortIds(userId: string): Promise<string[]> {
  const rows = await prisma.cohortMembership.findMany({ where: { UserID: userId, Status: "ACTIVE" }, select: { CohortID: true } });
  return rows.map((r) => r.CohortID);
}

/** "all" for admins, the lecturer's own cohorts for lecturers, nothing for students. */
export async function manageableCohorts(actor: Actor): Promise<"all" | string[]> {
  if (actor.role === "ADMIN") return "all";
  if (actor.role === "INSTRUCTOR") return memberCohortIds(actor.id);
  return [];
}

export async function canManageCohort(actor: Actor | null, cohortId: string): Promise<boolean> {
  if (!actor) return false;
  if (actor.role === "ADMIN") return true;
  if (actor.role !== "INSTRUCTOR") return false;
  const membership = await prisma.cohortMembership.findFirst({ where: { UserID: actor.id, CohortID: cohortId, Status: "ACTIVE" }, select: { UserID: true } });
  return !!membership;
}

/** Prisma filter for "rows in a cohort this person may manage". */
export const inCohorts = (scope: "all" | string[]) => (scope === "all" ? {} : { CohortID: { in: scope } });
