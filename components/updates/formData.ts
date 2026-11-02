import { prisma } from "@/lib/prisma";

/** Cohorts and lessons offered in the compose form. */
export async function formOptions() {
  const [cohorts, lessons] = await Promise.all([
    prisma.cohort.findMany({ orderBy: { CohortName: "asc" }, select: { CohortID: true, CohortName: true } }),
    prisma.lesson.findMany({
      orderBy: [{ course: { Title: "asc" } }, { SequenceOrder: "asc" }],
      take: 300,
      select: { LessonID: true, Title: true, SequenceOrder: true, course: { select: { Title: true, cohort: { select: { CohortName: true } } } } },
    }),
  ]);
  return {
    cohorts: cohorts.map((c) => ({ id: c.CohortID, name: c.CohortName })),
    lessons: lessons.map((l) => ({ id: l.LessonID, label: `${l.course.cohort.CohortName} · ${l.course.Title} · Lesson ${l.SequenceOrder}: ${l.Title}` })),
  };
}
