import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Sidebar, { LessonTabs } from "@/components/Sidebar";
import Footer from "@/components/Footer";

type Props = {
  lessonId: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN" | undefined;
  topicNumber: number;
  title: string;
  // The lecturer who added the lesson, if known.
  lecturerName?: string | null;
  align?: "left" | "center";
  children: ReactNode;
};

// Page frame for the lesson sections (Video, Notes): navbar, the 1-2-3 sidebar, a
// "Topic N" heading, and the footer — the layout from the design mockup.
export default function LessonShell({ lessonId, role, topicNumber, title, lecturerName, align = "left", children }: Props) {
  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <Sidebar lessonId={lessonId} role={role} />

        <main className="flex-1 px-6 py-12 min-w-0">
          <LessonTabs lessonId={lessonId} />

          <div className={`max-w-3xl mx-auto ${align === "center" ? "text-center" : ""}`}>
            <div className={`flex flex-wrap items-center gap-3 mb-8 ${align === "center" ? "justify-center" : ""}`}>
              <span className="rounded px-3 py-1 text-xs font-bold text-white" style={{ background: "#E02020" }}>
                Topic {topicNumber}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {lecturerName && (
                <p className="basis-full text-sm" style={{ color: "#6b7280" }}>
                  Lecturer: <span className="font-semibold text-gray-900">{lecturerName}</span>
                </p>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
