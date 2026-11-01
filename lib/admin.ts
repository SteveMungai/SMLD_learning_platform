import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Result = { error: string | null; message?: string; id?: string };

export const ROLE_LABEL = { STUDENT: "Student", INSTRUCTOR: "Lecturer", ADMIN: "Admin" } as const;

/** The signed-in admin, or null. Every admin page and action calls this */
export async function adminSession(): Promise<{ id: string } | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  return user?.id && user.role === "ADMIN" ? { id: user.id } : null;
}

/** Writes one row to the audit trail. A logging failure must never undo the change itself. */
export async function logAdmin(adminId: string, action: string, targetType: string, targetId: string) {
  try {
    await prisma.adminLog.create({ data: { AdminID: adminId, Action: action, TargetType: targetType, TargetID: targetId } });
  } catch (err) {
    console.error("Could not write admin log:", err);
  }
}

/** Times are stored in UTC; people read them in Nairobi time. */
export const formatEAT = (d: Date) =>
  new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "short" }).format(d);

export const cardStyle = { border: "0.5px solid #e5e7eb" } as const;
