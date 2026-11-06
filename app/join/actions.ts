"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JOIN_PROBLEM, lookupJoinCode } from "@/lib/joinCodes";

export type JoinResult = { error: string | null; cohortName?: string; already?: boolean };

/**
 * A signed-in student enters a code and joins that cohort.
 * Lecturers can't use this: a lecturer's cohort membership gives them the right to add lessons and
 * grade, so an admin has to grant it.
 */
export async function joinWithCode(code: string): Promise<JoinResult> {
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) return { error: "Please log in first." };
  if (user.role !== "STUDENT") return { error: "Lecturers are added to cohorts by an admin." };

  const found = await lookupJoinCode(code);
  if (!found.ok) return { error: JOIN_PROBLEM };

  const existing = await prisma.cohortMembership.findUnique({
    where: { UserID_CohortID: { UserID: user.id, CohortID: found.cohort.CohortID } },
  });
  if (existing?.Status === "ACTIVE") return { error: null, cohortName: found.cohort.CohortName, already: true };

  await prisma.cohortMembership.upsert({
    where: { UserID_CohortID: { UserID: user.id, CohortID: found.cohort.CohortID } },
    create: { UserID: user.id, CohortID: found.cohort.CohortID, Status: "ACTIVE" },
    update: { Status: "ACTIVE" },
  });
  revalidatePath("/lessons", "layout");
  revalidatePath("/updates", "layout");
  revalidatePath("/grades");
  return { error: null, cohortName: found.cohort.CohortName };
}
