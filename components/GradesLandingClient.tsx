"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export type CellStatus = "missing" | "submitted" | "late" | "graded" | "graded-late";

export type GradesLesson = {
  LessonID: string;
  Title: string;
  SequenceOrder: number;
  hasAssignment: boolean;
  assignmentTitle: string | null;
  deadline: string | null;
  total: number;
  submitted: number;
  graded: number;
  ungraded: number;
  late: number;
  missing: number;
};

export type StudentStatus = {
  StudentID: string;
  Name: string;
  Email: string;
  NameValid: boolean;
  statuses: Record<string, CellStatus>; // by lessonId; lessons without an assignment are absent
};

export type GradesCohort = {
  CohortID: string;
  CohortName: string;
  AcademicYear: string;
  courses: { CourseID: string; Title: string; lessons: GradesLesson[] }[];
  students: StudentStatus[];
};

type LessonFilter = "all" | "needs-grading" | "has-late" | "has-missing" | "fully-graded" | "no-assignment";

const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };

const CELL: Record<CellStatus, { label: string; bg: string; color: string }> = {
  missing: { label: "Missing", bg: "rgba(224,32,32,0.1)", color: "#E02020" },
  submitted: { label: "Ungraded", bg: "#f3f4f6", color: "#4b5563" },
  late: { label: "Late · ungraded", bg: "#111111", color: "#ffffff" },
  graded: { label: "Graded", bg: "rgba(16,185,129,0.1)", color: "#059669" },
  "graded-late": { label: "Graded · late", bg: "rgba(16,185,129,0.1)", color: "#059669" },
};

export default function GradesLandingClient({ cohorts }: { cohorts: GradesCohort[] }) {
  const [cohortId, setCohortId] = useState(cohorts[0]?.CohortID ?? "");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LessonFilter>("all");

  const cohort = useMemo(() => cohorts.find((c) => c.CohortID === cohortId) ?? cohorts[0], [cohorts, cohortId]);

  const q = query.trim().toLowerCase();

  const lessonMatchesFilter = (l: GradesLesson) => {
    switch (filter) {
      case "needs-grading": return l.hasAssignment && l.ungraded > 0;
      case "has-late": return l.late > 0;
      case "has-missing": return l.hasAssignment && l.missing > 0;
      case "fully-graded": return l.hasAssignment && l.submitted > 0 && l.ungraded === 0;
      case "no-assignment": return !l.hasAssignment;
      default: return true;
    }
  };

  const filteredCourses = useMemo(() => {
    if (!cohort) return [];
    return cohort.courses
      .map((course) => ({
        ...course,
        lessons: course.lessons.filter((l) => {
          const text = `${l.Title} ${l.assignmentTitle ?? ""} ${course.Title}`.toLowerCase();
          return (!q || text.includes(q)) && lessonMatchesFilter(l);
        }),
      }))
      .filter((c) => c.lessons.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohort, q, filter]);

  // "Scan through users": once you type 2+ characters, matching students appear with their status in every lesson.
  const matchedStudents = useMemo(() => {
    if (!cohort || q.length < 2) return [];
    return cohort.students.filter((s) => s.Name.toLowerCase().includes(q) || s.Email.toLowerCase().includes(q)).slice(0, 8);
  }, [cohort, q]);

  const lessonTitle = useMemo(() => {
    const map = new Map<string, GradesLesson>();
    cohort?.courses.forEach((c) => c.lessons.forEach((l) => map.set(l.LessonID, l)));
    return map;
  }, [cohort]);

  if (!cohort) {
    return (
      <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1 px-6 py-16 max-w-3xl mx-auto w-full">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Grades</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>No cohorts or lessons have been created yet.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const filters: { id: LessonFilter; label: string }[] = [
    { id: "all", label: "All lessons" },
    { id: "needs-grading", label: "Needs grading" },
    { id: "has-late", label: "Has late work" },
    { id: "has-missing", label: "Has missing work" },
    { id: "fully-graded", label: "Fully graded" },
    { id: "no-assignment", label: "No assignment" },
  ];

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 px-6 py-16 max-w-4xl mx-auto w-full">
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Grades</h1>
          <p className="text-[15px] leading-relaxed" style={{ color: "#6b7280" }}>
            Pick a lesson to see who has submitted, grade their work and give feedback.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative inline-block">
            <select
              value={cohort.CohortID}
              onChange={(e) => setCohortId(e.target.value)}
              aria-label="Cohort"
              style={{ background: "#ffffff", border: "0.5px solid #e5e7eb", color: "#111111" }}
              className="appearance-none rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600/20"
            >
              {cohorts.map((c) => (
                <option key={c.CohortID} value={c.CohortID}>{c.CohortName} — {c.AcademicYear}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
          </div>

          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lessons or students…"
              aria-label="Search lessons or students"
              style={{ border: "0.5px solid #e5e7eb", color: "#111111" }}
              className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter lessons">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={filter === f.id ? { background: "#111111", color: "#fff" } : { background: "#f3f4f6", color: "#4b5563" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Students matching the search */}
        {matchedStudents.length > 0 && (
          <section className="mb-12" aria-label="Matching students">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2" style={{ borderBottom: "0.5px solid #e5e7eb" }}>Students</h2>
            <div className="space-y-3">
              {matchedStudents.map((s) => {
                const entries = Object.entries(s.statuses);
                return (
                  <div key={s.StudentID} style={cardStyle} className="p-5 rounded-xl">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <p className="text-[15px] font-semibold text-gray-900">{s.Name}</p>
                      {!s.NameValid && (
                        <span title="This name doesn't look like a real full name, which is needed for the certificate." className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}>
                          <AlertTriangle size={10} /> Check name
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "#9ca3af" }}>{s.Email}</span>
                    </div>
                    {entries.length === 0 ? (
                      <p className="text-xs" style={{ color: "#9ca3af" }}>No published assignments yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {entries.map(([lessonId, status]) => {
                          const l = lessonTitle.get(lessonId);
                          const c = CELL[status];
                          return (
                            <Link
                              key={lessonId}
                              href={`/questions/${lessonId}/grade?q=${encodeURIComponent(s.Email)}`}
                              className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: c.bg, color: c.color }}
                              title={`${l?.Title ?? "Lesson"} — ${c.label}`}
                            >
                              L{l?.SequenceOrder ?? "?"} · {c.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Courses + lessons */}
        {filteredCourses.length === 0 ? (
         
          matchedStudents.length === 0 && (
            <p className="text-sm" style={{ color: "#6b7280" }}>
              {q || filter !== "all" ? "No lessons or students match your search or filter." : "This cohort has no lessons yet."}
            </p>
          )
        ) : (
          <div className="space-y-12">
            {filteredCourses.map((course) => (
              <section key={course.CourseID}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2" style={{ borderBottom: "0.5px solid #e5e7eb" }}>{course.Title}</h2>
                <div className="space-y-3">
                  {course.lessons.map((l) => (
                    <Link
                      key={l.LessonID}
                      href={l.hasAssignment ? `/questions/${l.LessonID}/grade` : `/questions/${l.LessonID}`}
                      style={cardStyle}
                      className="flex items-center justify-between gap-4 p-5 rounded-xl transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex items-center min-w-0">
                        <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold mr-4" style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#6b7280" }}>
                          {l.SequenceOrder}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 truncate">{l.Title}</p>
                          <p className="text-xs truncate" style={{ color: "#9ca3af" }}>
                            {l.hasAssignment ? l.assignmentTitle : "No published assignment — set questions"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {l.hasAssignment && (
                          <>
                            <Stat label={`${l.submitted}/${l.total} submitted`} tone="gray" />
                            {l.ungraded > 0 && <Stat label={`${l.ungraded} to grade`} tone="red" />}
                            {l.late > 0 && <Stat label={`${l.late} late`} tone="dark" />}
                            {l.missing > 0 && <Stat label={`${l.missing} missing`} tone="gray" />}
                            {l.submitted > 0 && l.ungraded === 0 && <Stat label="All graded" tone="green" />}
                          </>
                        )}
                        <ChevronRight size={16} style={{ color: "#d1d5db" }} />
                      </div>
                    </Link>
                  ))}
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

function Stat({ label, tone }: { label: string; tone: "gray" | "red" | "dark" | "green" }) {
  const styles = {
    gray: { background: "#f3f4f6", color: "#4b5563" },
    red: { background: "rgba(224,32,32,0.1)", color: "#E02020" },
    dark: { background: "#111111", color: "#ffffff" },
    green: { background: "rgba(16,185,129,0.1)", color: "#059669" },
  }[tone];
  return <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={styles}>{label}</span>;
}
