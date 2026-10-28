import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ChevronRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };

type Badge = { label: string; tone: "red" | "green" | "gray" };

const TONES = {
  red: { background: "rgba(224,32,32,0.1)", color: "#E02020" },
  green: { background: "rgba(22,163,74,0.1)", color: "#15803d" },
  gray: { background: "#f3f4f6", color: "#6b7280" },
};

export default async function QuestionsIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role;
  const isStaff = role === "INSTRUCTOR" || role === "ADMIN";

  // Students see lessons from their own cohorts; lecturers see every lesson
  // (there is no instructor-to-cohort relation yet).
  const courses = await prisma.course.findMany({
    where: isStaff ? {} : { cohort: { memberships: { some: { UserID: userId, Status: "ACTIVE" } } } },
    orderBy: [{ CohortID: "asc" }, { Title: "asc" }],
    include: {
      cohort: { select: { CohortName: true } },
      lessons: {
        orderBy: { SequenceOrder: "asc" },
        include: {
          assignments: {
            where: isStaff ? {} : { Status: "PUBLISHED" },
            take: 1,
            include: {
              submissions: isStaff
                ? { where: { Status: { in: ["SUBMITTED", "LATE"] } }, select: { SubmissionID: true } }
                : { where: { StudentID: userId }, include: { grade: true } },
            },
          },
        },
      },
    },
  });

  function badgeFor(lesson: (typeof courses)[number]["lessons"][number]): Badge {
    const a = lesson.assignments[0];
    if (!a) return { label: isStaff ? "Not set" : "No questions yet", tone: "gray" };

    if (isStaff) {
      return a.Status === "DRAFT"
        ? { label: "Draft", tone: "gray" }
        : { label: `Published · ${a.submissions.length} submitted`, tone: "green" };
    }

    const sub = a.submissions[0] as { Status: string; grade?: { Status: string; TotalScore: number | null; MaxPossibleScore: number | null } | null } | undefined;
    if (sub?.grade?.Status === "COMPLETE") return { label: `Graded ${sub.grade.TotalScore ?? 0}/${sub.grade.MaxPossibleScore ?? 0}`, tone: "green" };
    if (sub && sub.Status !== "DRAFT") return { label: "Submitted", tone: "green" };
    if (sub) return { label: "Draft saved", tone: "gray" };
    return { label: "To do", tone: "red" };
  }

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <Sidebar role={role} />
        <main className="flex-1 px-6 py-16">
          <section className="max-w-3xl mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Questions</h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              {isStaff
                ? "Choose a lesson to set its questions, deadline and scoring."
                : "Choose a lesson to answer its questions and review what you've submitted."}
            </p>
          </section>

          {courses.length === 0 ? (
            <p className="text-sm" style={{ color: "#6b7280" }}>
              {isStaff ? "No lessons have been created yet." : "You are not currently assigned to a cohort."}
            </p>
          ) : (
            <div className="max-w-3xl space-y-12">
              {courses.map((course) => (
                <section key={course.CourseID}>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{course.Title}</h2>
                  <p className="text-xs mb-4 pb-2" style={{ color: "#9ca3af", borderBottom: "0.5px solid #e5e7eb" }}>{course.cohort.CohortName}</p>
                  <div className="space-y-3">
                    {course.lessons.length === 0 && <p className="text-sm" style={{ color: "#9ca3af" }}>No lessons in this course yet.</p>}
                    {course.lessons.map((lesson) => {
                      const badge = badgeFor(lesson);
                      return (
                        <Link
                          key={lesson.LessonID}
                          href={`/questions/${lesson.LessonID}`}
                          style={cardStyle}
                          className="flex items-center justify-between p-5 rounded-xl transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-center min-w-0">
                            <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold mr-4" style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#6b7280" }}>
                              {lesson.SequenceOrder}
                            </span>
                            <span className="text-[15px] font-semibold text-gray-900 truncate">{lesson.Title}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={TONES[badge.tone]}>{badge.label}</span>
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
      </div>
      <Footer />
    </div>
  );
}
