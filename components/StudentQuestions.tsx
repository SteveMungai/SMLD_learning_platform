"use client";

import { useMemo, useState } from "react";
import { Clock, Paperclip, X, CheckCircle2 } from "lucide-react";
import type { AssignmentData, SubmissionData } from "@/components/types";

type Props = {
  lessonId: string;
  assignment: AssignmentData | null;
  existingSubmission: SubmissionData | null;
  isPreview: boolean;
};

// Shown only when isPreview is true (logged-out visitor) or when a lecturer
// hasn't published a real assignment for this lesson yet.
const MOCK_ASSIGNMENT: AssignmentData = {
  AssignmentID: "mock-assignment",
  LessonID: "mock-lesson",
  CohortID: "mock-cohort",
  Title: "Week 3 — Pastoral Care Reflection",
  Description: "Reflect on this week's readings and respond to each question in your own words.",
  DeadlineDate: "2026-09-02T23:59:00.000Z",
  MaxScore: 25,
  questions: [
    { QuestionID: "q1", AssignmentID: "mock-assignment", SequenceOrder: 1, QuestionText: "What does servant leadership look like in a local church context?", QuestionType: "SHORT_ANSWER", MaxScore: 10 },
    { QuestionID: "q2", AssignmentID: "mock-assignment", SequenceOrder: 2, QuestionText: "Describe a boundary you would set as a pastoral caregiver, and why.", QuestionType: "SHORT_ANSWER", MaxScore: 10 },
    { QuestionID: "q3", AssignmentID: "mock-assignment", SequenceOrder: 3, QuestionText: "Summarize the main idea of this week's lesson in 3–4 sentences.", QuestionType: "ESSAY", MaxScore: 5 },
  ],
};

const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };
const inputStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb", color: "#111111" };

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPastDeadline(iso: string) {
  return new Date() > new Date(iso);
}

export default function StudentQuestionsView({ lessonId, assignment, existingSubmission, isPreview }: Props) {
  const activeAssignment = assignment ?? MOCK_ASSIGNMENT;

  const initialAnswers = useMemo(() => {
    const map: Record<string, string> = {};
    existingSubmission?.answers.forEach((a) => {
      map[a.QuestionID] = a.AnswerText ?? "";
    });
    return map;
  }, [existingSubmission]);

  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingSubmission);
  const [receiptCode, setReceiptCode] = useState<string | null>(existingSubmission?.ReceiptCode ?? null);
  const [error, setError] = useState<string | null>(null);

  const late = useMemo(() => isPastDeadline(activeAssignment.DeadlineDate), [activeAssignment.DeadlineDate]);
  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError(null);

    if (isPreview) {
      // No real data to save
      setReceiptCode(`PREVIEW-${Date.now().toString(36).toUpperCase()}`);
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("assignmentId", activeAssignment.AssignmentID);
      formData.append(
        "answers",
        JSON.stringify(
          activeAssignment.questions.map((q) => ({
            questionId: q.QuestionID,
            answerText: answers[q.QuestionID] ?? "",
          }))
        )
      );
      attachments.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/submissions", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Submission failed. Please try again.");
      }
      const data = await res.json();
      setReceiptCode(data.ReceiptCode);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle2 size={48} style={{ color: "#E02020" }} className="mx-auto mb-5" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Received</h2>
        <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
          Your answers for <span className="font-semibold text-gray-900">{activeAssignment.Title}</span> have been recorded.
        </p>
        <div style={cardStyle} className="inline-block rounded-lg px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>
            Receipt Code
          </p>
          <p className="text-lg font-mono font-bold text-gray-900">{receiptCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section style={cardStyle} className="p-6 rounded-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{activeAssignment.Title}</h1>
        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
          {activeAssignment.Description}
        </p>
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full"
          style={late ? { background: "rgba(224,32,32,0.1)", color: "#E02020" } : { background: "#f9fafb", color: "#374151" }}
        >
          <Clock size={15} />
          {late ? "Deadline passed — " : "Due "}
          {formatDeadline(activeAssignment.DeadlineDate)}
        </div>
      </section>

      <div className="flex items-center gap-3 text-sm" style={{ color: "#6b7280" }}>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${(answeredCount / activeAssignment.questions.length) * 100}%`, background: "#E02020" }}
          />
        </div>
        <span className="font-semibold text-gray-900">
          {answeredCount}/{activeAssignment.questions.length} answered
        </span>
      </div>

      <div className="space-y-5">
        {activeAssignment.questions.map((q) => (
          <div key={q.QuestionID} style={cardStyle} className="p-6 rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mt-0.5"
                  style={{ background: "rgba(224,32,32,0.1)", color: "#E02020" }}
                >
                  {q.SequenceOrder}
                </span>
                <p className="text-[15px] font-semibold text-gray-900 leading-relaxed">{q.QuestionText}</p>
              </div>
              <span className="flex-shrink-0 text-xs font-semibold ml-3" style={{ color: "#9ca3af" }}>
                {q.MaxScore} pts
              </span>
            </div>

            <textarea
              value={answers[q.QuestionID] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.QuestionID]: e.target.value }))}
              rows={4}
              placeholder="Type your answer here…"
              style={inputStyle}
              className="rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-y ml-10 w-[calc(100%-2.5rem)]"
            />
          </div>
        ))}
      </div>

      <section style={cardStyle} className="p-6 rounded-xl">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Attach files (optional)</h3>
        <label
          style={{ border: "0.5px solid #e5e7eb", color: "#374151" }}
          className="inline-flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2.5 cursor-pointer transition-colors hover:bg-gray-50"
        >
          <Paperclip size={16} />
          Choose files
          <input type="file" multiple onChange={handleFileChange} className="hidden" />
        </label>

        {attachments.length > 0 && (
          <ul className="mt-4 space-y-2">
            {attachments.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                style={{ background: "#f9fafb", border: "0.5px solid #f3f4f6" }}
                className="flex items-center justify-between text-sm rounded-lg px-3 py-2"
              >
                <span className="truncate" style={{ color: "#374151" }}>{file.name}</span>
                <button onClick={() => removeAttachment(i)} aria-label={`Remove ${file.name}`} style={{ color: "#9ca3af" }}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p className="text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ background: "#E02020" }}
          className="text-sm font-semibold text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Assignment"}
        </button>
      </div>
    </div>
  );
}