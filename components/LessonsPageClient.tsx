"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlayCircle, Headphones, FileText, Video as VideoIcon, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AddLessonForm } from "@/components/lessons/AddLessonForm";

export type LessonSummary = {
  LessonID: string;
  Title: string;
  SequenceOrder: number;
  hasVideo: boolean;
  hasAudio: boolean;
  hasNotes: boolean;
  hasZoom: boolean;
};

export type CourseWithLessons = {
  CourseID: string;
  Title: string;
  lessons: LessonSummary[];
};

export type CohortOption = {
  CohortID: string;
  CohortName: string;
  AcademicYear: string;
  courses: CourseWithLessons[];
};

const cardStyle = {
  background: "#ffffff",
  border: "0.5px solid #e5e7eb",
};

function ContentBadge({ active, icon: Icon, label }: { active: boolean; icon: typeof PlayCircle; label: string }) {
  if (!active) return null;
  return (
    <span
      title={label}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full"
      style={{ background: "rgba(224,32,32,0.1)", color: "#E02020" }}
    >
      <Icon size={14} />
    </span>
  );
}

export default function LessonsPageClient({ cohorts, isStaff = false }: { cohorts: CohortOption[]; isStaff?: boolean }) {
  const [selectedCohortId, setSelectedCohortId] = useState(cohorts[0]?.CohortID ?? "");

  const selectedCohort = useMemo(
    () => cohorts.find((c) => c.CohortID === selectedCohortId) ?? cohorts[0],
    [cohorts, selectedCohortId]
  );

  if (!selectedCohort) {
    return (
      <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1 px-6 py-16 max-w-3xl mx-auto w-full">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Lessons</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>No lessons are available yet.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <main className="flex-1 px-6 py-16">
          <section className="max-w-3xl mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Lessons</h1>
            <p className="text-[15px] leading-relaxed" style={{ color: "#6b7280" }}>
              Browse lessons by cohort. Click a lesson to open its video, notes and questions.
            </p>
          </section>

          {/* Cohort selector */}
          <div className="mb-10 relative inline-block">
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              aria-label="Cohort"
              style={{ background: "#ffffff", border: "0.5px solid #e5e7eb", color: "#111111" }}
              className="appearance-none rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600/20"
            >
              {cohorts.map((cohort) => (
                <option key={cohort.CohortID} value={cohort.CohortID} style={{ background: "#ffffff" }}>
                  {cohort.CohortName} — {cohort.AcademicYear}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#9ca3af" }}
            />
          </div>

          {/* Courses + lessons for the selected cohort */}
          <div className="space-y-12 max-w-3xl">
            {selectedCohort.courses.map((course) => (
              <section key={course.CourseID}>
                <div className="flex flex-wrap items-end justify-between gap-3 mb-4 pb-2" style={{ borderBottom: "0.5px solid #e5e7eb" }}>
                  <h2 className="text-xl font-bold text-gray-900">{course.Title}</h2>
                  {isStaff && <AddLessonForm courseId={course.CourseID} />}
                </div>

                <div className="space-y-3">
                  {[...course.lessons]
                    .sort((a, b) => a.SequenceOrder - b.SequenceOrder)
                    .map((lesson) => (
                      <Link
                        key={lesson.LessonID}
                        href={`/lessons/${lesson.LessonID}/video`}
                        style={cardStyle}
                        className="flex items-center justify-between p-5 rounded-xl transition-all duration-200 hover:shadow-sm cursor-pointer"
                      >
                        <div className="flex items-center min-w-0">
                          <span
                            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold mr-4"
                            style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#6b7280" }}
                          >
                            {lesson.SequenceOrder}
                          </span>
                          <span className="text-[15px] font-semibold text-gray-900 truncate">{lesson.Title}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <ContentBadge active={lesson.hasVideo} icon={PlayCircle} label="Video" />
                          <ContentBadge active={lesson.hasAudio} icon={Headphones} label="Audio" />
                          <ContentBadge active={lesson.hasNotes} icon={FileText} label="Notes" />
                          <ContentBadge active={lesson.hasZoom} icon={VideoIcon} label="Zoom recording" />
                        </div>
                      </Link>
                    ))}
                  {course.lessons.length === 0 && (
                    <p className="text-sm" style={{ color: "#9ca3af" }}>No lessons in this course yet.</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
