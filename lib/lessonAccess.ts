// lib/lessonAccess.ts
//
// One check shared by the lesson sub-pages (video, notes): you must be signed in, the lesson
// must exist, and students must belong to the lesson's cohort. Lecturers/admins can open any lesson.
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireLessonAccess(lessonId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const lesson = await prisma.lesson.findUnique({
    where: { LessonID: lessonId },
    include: { course: { select: { Title: true, CohortID: true } } },
  });
  if (!lesson) notFound();

  const role = session.user.role;
  const isStaff = role === "INSTRUCTOR" || role === "ADMIN";

  if (!isStaff) {
    const membership = await prisma.cohortMembership.findFirst({
      where: { UserID: session.user.id, CohortID: lesson.course.CohortID, Status: "ACTIVE" },
    });
    if (!membership) notFound();
  }

  return { userId: session.user.id, role, isStaff, lesson };
}
