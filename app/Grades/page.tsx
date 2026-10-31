import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ChevronRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidFullName } from "@/lib/names";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GradesLandingClient, { type GradesCohort, type StudentStatus } from "@/components/GradesLandingClient";

const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };

export default async function GradesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const isStaff = session.user.role === "INSTRUCTOR" || session.user.role === "ADMIN";

  // Lecturer / admin: every cohort
  if (isStaff) {
    const cohorts = await prisma.cohort.findMany({
      orderBy: { CohortName: "asc" },
      include: {
        memberships: {
          where: { Status: "ACTIVE", user: { Role: "STUDENT" } },
          include: { user: { select: { UserID: true, FullName: true, Email: true } } },
        },
        courses: {
          orderBy: { Title: "asc" },
          include: {
            lessons: {
              orderBy: { SequenceOrder: "asc" },
              include: {
                assignments: {
                  where: { Status: "PUBLISHED" },
                  take: 1,
                  include: {
                    submissions: {
                      where: { Status: { in: ["SUBMITTED", "LATE"] } },
                      select: { StudentID: true, SubmittedAt: true, grade: { select: { Status: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const data: GradesCohort[] = cohorts.map((cohort) => {
      const roster = cohort.memberships.map((m) => m.user);
      const rosterIds = new Set(roster.map((u) => u.UserID));
      const students = new Map<string, StudentStatus>(
        roster.map((u) => [
          u.UserID,
          { StudentID: u.UserID, Name: u.FullName ?? u.Email, Email: u.Email, NameValid: isValidFullName(u.FullName), statuses: {} },
        ])
      );

      const courses = cohort.courses.map((course) => ({
        CourseID: course.CourseID,
        Title: course.Title,
        lessons: course.lessons.map((lesson) => {
          const a = lesson.assignments[0];
          if (!a || !a.DeadlineDate) {
            return {
              LessonID: lesson.LessonID, Title: lesson.Title, SequenceOrder: lesson.SequenceOrder,
              hasAssignment: false, assignmentTitle: null, deadline: null,
              total: roster.length, submitted: 0, graded: 0, ungraded: 0, late: 0, missing: 0,
            };
          }
          const deadline = a.DeadlineDate;
          // Only current cohort students count, so people who left don't inflate the numbers.
          const subs = a.submissions.filter((s) => rosterIds.has(s.StudentID));
          const byStudent = new Map(subs.map((s) => [s.StudentID, s]));

          let graded = 0, late = 0;
          for (const u of roster) {
            const s = byStudent.get(u.UserID);
            const st = students.get(u.UserID)!;
            if (!s) { st.statuses[lesson.LessonID] = "missing"; continue; }
            const isLate = !!s.SubmittedAt && s.SubmittedAt > deadline;
            const isGraded = s.grade?.Status === "COMPLETE";
            if (isGraded) graded++;
            if (isLate) late++;
            st.statuses[lesson.LessonID] = isGraded ? (isLate ? "graded-late" : "graded") : isLate ? "late" : "submitted";
          }
          return {
            LessonID: lesson.LessonID, Title: lesson.Title, SequenceOrder: lesson.SequenceOrder,
            hasAssignment: true, assignmentTitle: a.Title, deadline: deadline.toISOString(),
            total: roster.length, submitted: subs.length, graded, ungraded: subs.length - graded, late,
            missing: roster.length - subs.length,
          };
        }),
      }));

      return {
        CohortID: cohort.CohortID,
        CohortName: cohort.CohortName,
        AcademicYear: cohort.AcademicYear,
        courses,
        students: [...students.values()].sort((a, b) => a.Name.localeCompare(b.Name)),
      };
    });

    return <GradesLandingClient cohorts={data} />;
  }

  // Student: their own results
  const courses = await prisma.course.findMany({
    where: { cohort: { memberships: { some: { UserID: userId, Status: "ACTIVE" } } } },
    orderBy: { Title: "asc" },
    include: {
      lessons: {
        orderBy: { SequenceOrder: "asc" },
        include: {
          assignments: {
            where: { Status: "PUBLISHED" },
            take: 1,
            include: { submissions: { where: { StudentID: userId }, include: { grade: true } } },
          },
        },
      },
    },
  });

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1 px-6 py-16 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">My grades</h1>
        <p className="text-sm mb-10" style={{ color: "#6b7280" }}>Your results and your lecturer&apos;s comments for each lesson.</p>

        {courses.length === 0 ? (
          <p className="text-sm" style={{ color: "#6b7280" }}>You are not currently assigned to a cohort.</p>
        ) : (
          <div className="space-y-12">
            {courses.map((course) => (
              <section key={course.CourseID}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2" style={{ borderBottom: "0.5px solid #e5e7eb" }}>{course.Title}</h2>
                <div className="space-y-3">
                  {course.lessons.map((lesson) => {
                    const a = lesson.assignments[0];
                    const sub = a?.submissions[0];
                    const submitted = !!sub && sub.Status !== "DRAFT";
                    const graded = sub?.grade?.Status === "COMPLETE";
                    const late = submitted && !!sub.SubmittedAt && !!a?.DeadlineDate && sub.SubmittedAt > a.DeadlineDate;
                    const badge = !a
                      ? { label: "No assignment", color: "#6b7280", bg: "#f3f4f6" }
                      : graded
                        ? { label: `${sub!.grade!.TotalScore ?? 0} / ${sub!.grade!.MaxPossibleScore ?? 0}`, color: "#15803d", bg: "rgba(22,163,74,0.1)" }
                        : submitted
                          ? { label: late ? "Submitted late · awaiting grade" : "Submitted · awaiting grade", color: "#374151", bg: "#f3f4f6" }
                          : { label: "Not submitted", color: "#E02020", bg: "rgba(224,32,32,0.1)" };
                    return (
                      <Link key={lesson.LessonID} href={`/questions/${lesson.LessonID}`} style={cardStyle} className="flex items-center justify-between p-5 rounded-xl transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center min-w-0">
                          <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold mr-4" style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#6b7280" }}>{lesson.SequenceOrder}</span>
                          <span className="text-[15px] font-semibold text-gray-900 truncate">{lesson.Title}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                          <ChevronRight size={16} style={{ color: "#d1d5db" }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
