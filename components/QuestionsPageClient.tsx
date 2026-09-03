"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import LecturerQuestionsView from "@/components/Lecturerquestions";
import StudentQuestionsView from "@/components/StudentQuestions";
import type { AssignmentData, SubmissionData } from "@/components/types";

type Props = {
  isAuthenticated: boolean;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN" | undefined;
  lessonId: string;
  assignment: AssignmentData | null;
  existingSubmission: SubmissionData | null;
};

export default function QuestionsPageClient({
  isAuthenticated,
  role,
  lessonId,
  assignment,
  existingSubmission,
}: Props) {
  // Only used for the logged-out preview, where we don't know a real role —
  // lets a visitor peek at both views before signing in.
  const [previewAs, setPreviewAs] = useState<"INSTRUCTOR" | "STUDENT">("STUDENT");

  const effectiveRole = isAuthenticated ? role : previewAs;

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar only renders for logged-in users */}
        {isAuthenticated && <Sidebar role={role} />}

        <main className="flex-1 px-6 py-16">
          <div className="max-w-3xl flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Assignment</h1>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                {effectiveRole === "INSTRUCTOR"
                  ? "Set up questions, deadline, and scoring for students."
                  : "Answer each question, attach files if needed, then submit."}
              </p>
            </div>

            {!isAuthenticated && (
              <div style={{ border: "0.5px solid #e5e7eb" }} className="flex items-center rounded-lg overflow-hidden text-xs font-bold uppercase tracking-wide">
                <button
                  onClick={() => setPreviewAs("INSTRUCTOR")}
                  className="px-3 py-2 transition-colors"
                  style={
                    previewAs === "INSTRUCTOR"
                      ? { background: "#E02020", color: "white" }
                      : { color: "#6b7280" }
                  }
                >
                  Lecturer
                </button>
                <button
                  onClick={() => setPreviewAs("STUDENT")}
                  className="px-3 py-2 transition-colors"
                  style={
                    previewAs === "STUDENT"
                      ? { background: "#E02020", color: "white" }
                      : { color: "#6b7280" }
                  }
                >
                  Student
                </button>
              </div>
            )}
          </div>

          {!isAuthenticated && (
            <div
              className="max-w-3xl mb-8 px-4 py-3 rounded-lg text-sm flex items-center justify-between"
              style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}
            >
              <span>You&apos;re viewing a preview with sample data. Log in to see and submit real assignments.</span>
              <Link href="/login" className="font-semibold underline flex-shrink-0 ml-4">
                Log in
              </Link>
            </div>
          )}

          <div className="max-w-3xl">
            {effectiveRole === "INSTRUCTOR" ? (
              <LecturerQuestionsView
                lessonId={lessonId}
                assignment={assignment}
                isPreview={!isAuthenticated}
              />
            ) : (
              <StudentQuestionsView
                lessonId={lessonId}
                assignment={assignment}
                existingSubmission={existingSubmission}
                isPreview={!isAuthenticated}
              />
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}