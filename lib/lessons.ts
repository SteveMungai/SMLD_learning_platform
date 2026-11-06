import { prisma } from "@/lib/prisma";

/**
 * Closes the gaps after a lesson is removed, so lessons are always numbered 1, 2, 3 ...
 * in their current order (delete lesson 1 and lesson 2 becomes lesson 1).
 */
export async function renumberLessons(courseId: string): Promise<void> {
  const lessons = await prisma.lesson.findMany({
    where: { CourseID: courseId },
    orderBy: [{ SequenceOrder: "asc" }, { DateCreated: "asc" }],
    select: { LessonID: true, SequenceOrder: true },
  });
  const changes = lessons
    .map((l, i) => ({ id: l.LessonID, from: l.SequenceOrder, to: i + 1 }))
    .filter((l) => l.from !== l.to);
  if (changes.length === 0) return;
  await prisma.$transaction(changes.map((c) => prisma.lesson.update({ where: { LessonID: c.id }, data: { SequenceOrder: c.to } })));
}
