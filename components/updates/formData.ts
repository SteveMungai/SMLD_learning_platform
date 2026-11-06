import { prisma } from "@/lib/prisma";
import { manageableCohorts, type Actor } from "@/lib/access";

/** Cohorts and lessons offered in the compose form: all of them for admins, a lecturer's own for lecturers. */
export async function formOptions(actor: Actor) {
  const scope = await manageableCohorts(actor);
  const cohortFilter = scope === "all" ? {} : { CohortID: { in: scope } };
  const [cohorts, lessons] = await Promise.all([
    prisma.cohort.findMany({ where: cohortFilter, orderBy: { CohortName: "asc" }, select: { CohortID: true, CohortName: true } }),
    prisma.lesson.findMany({
      where: { course: cohortFilter },
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
