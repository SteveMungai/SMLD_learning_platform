import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardStyle } from "@/lib/admin";
import { LessonRow } from "@/components/admin/AdminClient";
import { AddCourseForm } from "@/components/lessons/AddCourseForm";
import { ManageControls } from "@/components/lessons/ManageControls";
import { formatDay } from "@/lib/noteFiles";

type Search = Record<string, string | undefined>;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const [cohorts, lecturers] = await Promise.all([
    prisma.cohort.findMany({ orderBy: { CohortName: "asc" }, select: { CohortID: true, CohortName: true, AcademicYear: true } }),
    prisma.user.findMany({ where: { Role: { in: ["INSTRUCTOR", "ADMIN"] } }, orderBy: { FullName: "asc" }, select: { UserID: true, FullName: true, Email: true } }),
  ]);
  const current = cohorts.find((c) => c.CohortID === sp.c) ?? cohorts[0];
  const onlyMissing = sp.filter === "nolecturer";

  const courses = current
    ? await prisma.course.findMany({
        where: { CohortID: current.CohortID },
        orderBy: { Title: "asc" },
        include: {
          lessons: {
            orderBy: { SequenceOrder: "asc" },
            include: {
              createdBy: { select: { FullName: true } },
              video: { select: { VideoID: true } },
              audio: { select: { AudioID: true } },
              _count: { select: { notes: true, zoomMeetings: true } },
              assignments: { select: { _count: { select: { submissions: true } } } },
            },
          },
        },
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Courses &amp; Lessons</h1>
      <p className="text-sm mt-1 mb-5" style={{ color: "#6b7280" }}>Fix content without waiting for the lecturer.</p>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {cohorts.map((c) => (
          <Link key={c.CohortID} href={`/admin/courses?c=${c.CohortID}${onlyMissing ? "&filter=nolecturer" : ""}`}
            className="rounded-full px-4 py-1.5 text-sm font-semibold no-underline"
            style={{ background: c.CohortID === current?.CohortID ? "#E02020" : "#fff", color: c.CohortID === current?.CohortID ? "#fff" : "#374151", border: "0.5px solid #e5e7eb" }}>
            {c.CohortName} · {c.AcademicYear}
          </Link>
        ))}
      </div>
      {onlyMissing && (
        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
          Showing lessons with no lecturer recorded. <Link href={`/admin/courses?c=${current?.CohortID ?? ""}`} className="font-semibold" style={{ color: "#E02020" }}>Show all</Link>
        </p>
      )}

      {current && <div className="mb-5"><AddCourseForm cohortId={current.CohortID} /></div>}
      {!current && <p className="text-sm" style={{ color: "#6b7280" }}>No cohorts yet. Create one first.</p>}
      {current && courses.length === 0 && <p className="text-sm" style={{ color: "#6b7280" }}>This cohort has no courses yet.</p>}
      <div className="flex flex-col gap-5">
        {courses.map((course) => {
          const lessons = onlyMissing ? course.lessons.filter((l) => !l.createdBy) : course.lessons;
          return (
            <section key={course.CourseID} className="rounded-xl p-5" style={cardStyle}>
              <h2 className="text-lg font-bold text-gray-900 mb-1 break-words">{course.Title}</h2>
              <p className="text-xs mb-1" style={{ color: "#6b7280" }}>Added {formatDay(course.DateCreated)} · Add new lessons from the Lessons page.</p>
              <div className="mb-3">
                <ManageControls
                  kind="course"
                  id={course.CourseID}
                  title={course.Title}
                  impact={course.lessons.length === 0 ? "This course has no lessons." : `This permanently removes ${course.lessons.length} lesson${course.lessons.length === 1 ? "" : "s"} with all their notes, videos and assignments, and ${course.lessons.reduce((n, l) => n + l.assignments.reduce((m, a) => m + a._count.submissions, 0), 0)} student submission(s) with their grades.`}
                />
              </div>
              {lessons.length === 0 && <p className="text-sm py-3" style={{ color: "#6b7280" }}>{onlyMissing ? "Every lesson here has a lecturer." : "No lessons yet."}</p>}
              {lessons.map((l) => {
                const submissions = l.assignments.reduce((n, a) => n + a._count.submissions, 0);
                const impact = [
                  l.video && "1 video", l.audio && "1 audio",
                  l._count.notes && plural(l._count.notes, "note"),
                  l._count.zoomMeetings && plural(l._count.zoomMeetings, "Zoom meeting"),
                  l.assignments.length && `${plural(l.assignments.length, "assignment")} with ${plural(submissions, "student submission")} and their grades`,
                ].filter((x): x is string => typeof x === "string");
                const idx = course.lessons.findIndex((x) => x.LessonID === l.LessonID);
                return (
                  <LessonRow
                    key={l.LessonID}
                    lesson={{ id: l.LessonID, order: l.SequenceOrder, title: l.Title, lecturerId: l.CreatedByID ?? "", lecturerName: l.createdBy?.FullName ?? null,
                      content: `${impact.length ? "Has content" : "No content yet"} · Added ${formatDay(l.DateCreated)}`, impact }}
                    lecturers={lecturers.map((u) => ({ id: u.UserID, name: u.FullName ?? u.Email }))}
                    isFirst={idx === 0}
                    isLast={idx === course.lessons.length - 1}
                  />
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
