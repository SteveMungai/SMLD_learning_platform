"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User } from "lucide-react";
import type { GradingAssignmentData, GradableSubmission } from "@/components/types";

type Props = {
  assignment: GradingAssignmentData;
};

const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };

function formatSubmittedAt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function GradingView({ assignment }: Props) {
  const [submissions, setSubmissions] = useState<GradableSubmission[]>(assignment.submissions);
  const [selectedId, setSelectedId] = useState<string | null>(submissions[0]?.SubmissionID ?? null);

  // Per-question score drafts and overall feedback draft, keyed by submissionId
  // so switching between students doesn't lose unsaved edits.
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, Record<string, string>>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => submissions.find((s) => s.SubmissionID === selectedId) ?? null,
    [submissions, selectedId]
  );

  function getScoreDraft(submissionId: string, questionId: string, fallback: number | null) {
    const draft = scoreDrafts[submissionId]?.[questionId];
    if (draft !== undefined) return draft;
    return fallback !== null ? String(fallback) : "";
  }

  function setScoreDraft(submissionId: string, questionId: string, value: string) {
    setScoreDrafts((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], [questionId]: value },
    }));
  }

  function getFeedbackDraft(submission: GradableSubmission) {
    return feedbackDrafts[submission.SubmissionID] ?? submission.grade?.OverallFeedback ?? "";
  }

  const maxPossibleScore = assignment.questions.reduce((sum, q) => sum + q.MaxScore, 0);

  function computeTotal(submission: GradableSubmission) {
    return assignment.questions.reduce((sum, q) => {
      const raw = getScoreDraft(submission.SubmissionID, q.QuestionID, findAnswerScore(submission, q.QuestionID));
      const num = Number(raw);
      return sum + (Number.isFinite(num) ? num : 0);
    }, 0);
  }

  function findAnswerScore(submission: GradableSubmission, questionId: string) {
    return submission.answers.find((a) => a.QuestionID === questionId)?.ScoreAwarded ?? null;
  }

  function findAnswerText(submission: GradableSubmission, questionId: string) {
    return submission.answers.find((a) => a.QuestionID === questionId)?.AnswerText ?? "";
  }

  async function handlePublish() {
    if (!selected) return;
    setError(null);
    setPublishing(true);

    try {
      const answers = assignment.questions.map((q) => ({
        questionId: q.QuestionID,
        score: Number(getScoreDraft(selected.SubmissionID, q.QuestionID, findAnswerScore(selected, q.QuestionID))) || 0,
      }));

      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selected.SubmissionID,
          answers,
          overallFeedback: getFeedbackDraft(selected),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to publish grade.");
      }

      const data = await res.json();

      setSubmissions((prev) =>
        prev.map((s) =>
          s.SubmissionID === selected.SubmissionID
            ? {
                ...s,
                grade: {
                  GradeID: data.GradeID,
                  TotalScore: data.TotalScore,
                  MaxPossibleScore: data.MaxPossibleScore,
                  OverallFeedback: data.OverallFeedback,
                  Status: "COMPLETE",
                },
              }
            : s
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Left — student list */}
        <aside className="w-72 shrink-0 border-r px-4 py-8" style={{ borderColor: "#e5e7eb" }}>
          <div className="space-y-2">
            {submissions.map((s) => {
              const isSelected = s.SubmissionID === selectedId;
              const isGraded = s.grade?.Status === "COMPLETE";

              return (
                <button
                  key={s.SubmissionID}
                  onClick={() => setSelectedId(s.SubmissionID)}
                  style={{
                    ...cardStyle,
                    borderColor: isSelected ? "#E02020" : "#e5e7eb",
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#6b7280" }}
                    >
                      <User size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.StudentName}</p>
                      <p className="text-xs truncate" style={{ color: "#9ca3af" }}>
                        {assignment.Title}
                      </p>
                    </div>
                  </div>
                  <span
                    className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ml-2"
                    style={
                      isGraded
                        ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                        : { background: "#f3f4f6", color: "#6b7280" }
                    }
                  >
                    {isGraded ? "Graded" : "Ungraded"}
                  </span>
                </button>
              );
            })}

            {submissions.length === 0 && (
              <p className="text-sm px-2 py-4" style={{ color: "#9ca3af" }}>
                No submissions yet.
              </p>
            )}
          </div>
        </aside>

        {/* Center — questions and student answers */}
        <main className="flex-1 px-8 py-8 min-w-0">
          {!selected ? (
            <p className="text-sm" style={{ color: "#9ca3af" }}>
              Select a student to view their submission.
            </p>
          ) : (
            <div className="space-y-8 max-w-2xl">
              {assignment.questions.map((q) => (
                <div key={q.QuestionID}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-[15px] font-semibold text-gray-900">
                      {q.SequenceOrder}. {q.QuestionText}{" "}
                      <span className="font-normal" style={{ color: "#9ca3af" }}>
                        ({q.MaxScore} mrk{q.MaxScore !== 1 ? "s" : ""})
                      </span>
                    </h3>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={q.MaxScore}
                        value={getScoreDraft(selected.SubmissionID, q.QuestionID, findAnswerScore(selected, q.QuestionID))}
                        onChange={(e) => setScoreDraft(selected.SubmissionID, q.QuestionID, e.target.value)}
                        style={{ border: "0.5px solid #e5e7eb", color: "#111111" }}
                        className="w-14 text-xs font-semibold rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-red-600/20"
                      />
                      <span className="text-xs" style={{ color: "#9ca3af" }}>
                        / {q.MaxScore}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed pl-5" style={{ color: "#374151" }}>
                    {findAnswerText(selected, q.QuestionID) || (
                      <span style={{ color: "#d1d5db" }}>No answer provided.</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right — submission meta, feedback, score, publish */}
        {selected && (
          <aside className="w-80 shrink-0 border-l px-6 py-8" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#9ca3af" }}>
              Submission time
            </p>
            <p className="text-sm font-semibold text-gray-900 mb-2">{formatSubmittedAt(selected.SubmittedAt)}</p>
            {selected.IsLate && (
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded mb-6"
                style={{ background: "#111111", color: "white" }}
              >
                Late
              </span>
            )}
            {!selected.IsLate && <div className="mb-6" />}

            <p className="text-xs font-semibold mb-2" style={{ color: "#9ca3af" }}>
              Lecturer Feedback
            </p>
            <textarea
              value={getFeedbackDraft(selected)}
              onChange={(e) =>
                setFeedbackDrafts((prev) => ({ ...prev, [selected.SubmissionID]: e.target.value }))
              }
              rows={6}
              placeholder="Leave feedback for the student…"
              style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#111111" }}
              className="w-full rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-none mb-6"
            />

            <p className="text-xs font-semibold mb-2" style={{ color: "#9ca3af" }}>
              Assessment Score
            </p>
            <div
              style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-900 mb-6"
            >
              {computeTotal(selected)}/{maxPossibleScore}
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg mb-4" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>
                {error}
              </p>
            )}

            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{ background: "#111111" }}
              className="w-full text-sm font-semibold text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {publishing ? "Publishing…" : "Publish grade"}
            </button>
          </aside>
        )}
      </div>

      <Footer />
    </div>
  );
}