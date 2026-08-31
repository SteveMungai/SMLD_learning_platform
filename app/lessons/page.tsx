"use client";

import { useMemo, useState } from "react";
import { PlayCircle, Headphones, FileText, Video as VideoIcon, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

type LessonSummary = {
  LessonID: string;
  Title: string;
  SequenceOrder: number;
  hasVideo: boolean;
  hasAudio: boolean;
  hasNotes: boolean;
  hasZoom: boolean;
};

type CourseWithLessons = {
  CourseID: string;
  Title: string;
  lessons: LessonSummary[];
};

type CohortOption = {
  CohortID: string;
  CohortName: string;
  AcademicYear: string;
  courses: CourseWithLessons[];
};

// Placeholder — replace with a server-side Prisma fetch, e.g.:
//   const cohorts = await prisma.cohort.findMany({
//     include: { courses: { include: { lessons: true } } },
//   });
const MOCK_COHORTS: CohortOption[] = [
  {
    CohortID: "cohort-1",
    CohortName: "Claycity January Cohort",
    AcademicYear: "2026",
    courses: [
      {
        CourseID: "course-1",
        Title: "Foundations of Pastoral Care",
        lessons: [
          { LessonID: "l1", Title: "Introduction to Pastoral Ministry", SequenceOrder: 1, hasVideo: true, hasAudio: true, hasNotes: true, hasZoom: false },
          { LessonID: "l2", Title: "Listening as a Ministry Skill", SequenceOrder: 2, hasVideo: true, hasAudio: false, hasNotes: true, hasZoom: true },
          { LessonID: "l3", Title: "Boundaries in Care Relationships", SequenceOrder: 3, hasVideo: false, hasAudio: true, hasNotes: true, hasZoom: false },
        ],
      },
      {
        CourseID: "course-2",
        Title: "Leadership and Organizational Health",
        lessons: [
          { LessonID: "l4", Title: "Servant Leadership Principles", SequenceOrder: 1, hasVideo: true, hasAudio: true, hasNotes: false, hasZoom: true },
          { LessonID: "l5", Title: "Managing Conflict in Ministry Teams", SequenceOrder: 2, hasVideo: true, hasAudio: false, hasNotes: true, hasZoom: false },
        ],
      },
    ],
  },
  {
    CohortID: "cohort-2",
    CohortName: "Claycity September Cohort",
    AcademicYear: "2026",
    courses: [
      {
        CourseID: "course-3",
        Title: "Theological Foundations",
        lessons: [
          { LessonID: "l6", Title: "Understanding Scripture in Context", SequenceOrder: 1, hasVideo: true, hasAudio: true, hasNotes: true, hasZoom: false },
        ],
      },
    ],
  },
];

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

export default function LessonsPage() {
  const router = useRouter();
  const [selectedCohortId, setSelectedCohortId] = useState(MOCK_COHORTS[0].CohortID);

  const selectedCohort = useMemo(
    () => MOCK_COHORTS.find((c) => c.CohortID === selectedCohortId) ?? MOCK_COHORTS[0],
    [selectedCohortId]
  );

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full">


        <main className="flex-1 px-6 py-16">
          <section className="max-w-3xl mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Lessons</h1>
            <p className="text-[15px] leading-relaxed" style={{ color: "#6b7280" }}>
              Browse lessons by cohort. Select a cohort below to see its courses and lessons.
            </p>
          </section>

          {/* Cohort selector */}
          <div className="mb-10 relative inline-block">
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              style={{ background: "#ffffff", border: "0.5px solid #e5e7eb", color: "#111111" }}
              className="appearance-none rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600/20"
            >
              {MOCK_COHORTS.map((cohort) => (
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
          <div className="space-y-12">
            {selectedCohort.courses.map((course) => (
              <section key={course.CourseID}>
                <h2
                  className="text-xl font-bold text-gray-900 mb-4 pb-2"
                  style={{ borderBottom: "0.5px solid #e5e7eb" }}
                >
                  {course.Title}
                </h2>

                <div className="space-y-3">
                  {course.lessons
                    .sort((a, b) => a.SequenceOrder - b.SequenceOrder)
                    .map((lesson) => (
                      <div
                        key={lesson.LessonID}
                        style={cardStyle}
                        className="flex items-center justify-between p-5 rounded-xl transition-all duration-200 hover:shadow-sm"
                        onClick={() => router.push(`/questions`)}
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
                      </div>
                    ))}
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