"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { AssignmentData } from "@/components/types";

type Props = {
  lessonId: string;
  assignment: AssignmentData | null;
  isPreview: boolean;
};

type QuestionDraft = {
  QuestionID: string;
  SequenceOrder: number;
  QuestionText: string;
  QuestionType: "SHORT_ANSWER" | "ESSAY";
  MaxScore: number;
};

const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };
const inputStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb", color: "#111111" };

export default function LecturerQuestionsView({ lessonId, assignment, isPreview }: Props) {
  const [title, setTitle] = useState(assignment?.Title ?? "");
  const [deadlineDate, setDeadlineDate] = useState(
    assignment ? assignment.DeadlineDate.slice(0, 16) : ""
  );
  const [description, setDescription] = useState(assignment?.Description ?? "");
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    assignment?.questions.length
      ? assignment.questions.map((q) => ({
          QuestionID: q.QuestionID,
          SequenceOrder: q.SequenceOrder,
          QuestionText: q.QuestionText,
          QuestionType: q.QuestionType,
          MaxScore: q.MaxScore,
        }))
      : [{ QuestionID: crypto.randomUUID(), SequenceOrder: 1, QuestionText: "", QuestionType: "SHORT_ANSWER", MaxScore: 10 }]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMaxScore = questions.reduce((sum, q) => sum + (Number(q.MaxScore) || 0), 0);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { QuestionID: crypto.randomUUID(), SequenceOrder: prev.length + 1, QuestionText: "", QuestionType: "SHORT_ANSWER", MaxScore: 10 },
    ]);
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.QuestionID !== id).map((q, i) => ({ ...q, SequenceOrder: i + 1 })));
  }

  function updateQuestion<K extends keyof QuestionDraft>(id: string, key: K, value: QuestionDraft[K]) {
    setQuestions((prev) => prev.map((q) => (q.QuestionID === id ? { ...q, [key]: value } : q)));
  }

  async function handlePublish() {
    setError(null);

    if (isPreview) {
      setSaved(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          title,
          deadlineDate,
          description,
          questions: questions.map(({ SequenceOrder, QuestionText, QuestionType, MaxScore }) => ({
            SequenceOrder,
            QuestionText,
            QuestionType,
            MaxScore,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to publish assignment.");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      {saved && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>
          {isPreview ? "Preview only — nothing was saved. Log in to publish for real." : "Assignment published."}
        </div>
      )}

      <section style={cardStyle} className="p-6 rounded-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Assignment Details</h2>
          {assignment && (
            <Link
              href={`/questions/${lessonId}/grade`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
              style={{ border: "0.5px solid #e5e7eb", color: "#374151" }}
            >
              View submissions to grade
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 3 — Pastoral Care Reflection"
              style={inputStyle}
              className="w-full rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>
              Deadline
            </label>
            <input
              type="datetime-local"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              style={inputStyle}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Instructions for students…"
            style={inputStyle}
            className="w-full rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-none"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            Questions{" "}
            <span className="text-sm font-normal" style={{ color: "#9ca3af" }}>
              — {questions.length} question{questions.length !== 1 ? "s" : ""}, {totalMaxScore} points total
            </span>
          </h2>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{ background: "#111111" }}
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.QuestionID} style={cardStyle} className="p-5 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center pt-2" style={{ color: "#d1d5db" }}>
                  <GripVertical size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                      style={{ background: "rgba(224,32,32,0.1)", color: "#E02020" }}
                    >
                      {q.SequenceOrder}
                    </span>

                    <div className="flex items-center gap-3">
                      <select
                        value={q.QuestionType}
                        onChange={(e) => updateQuestion(q.QuestionID, "QuestionType", e.target.value as QuestionDraft["QuestionType"])}
                        style={inputStyle}
                        className="text-xs font-semibold rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                      >
                        <option value="SHORT_ANSWER">Short Answer</option>
                        <option value="ESSAY">Essay</option>
                      </select>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          value={q.MaxScore}
                          onChange={(e) => updateQuestion(q.QuestionID, "MaxScore", Number(e.target.value))}
                          style={inputStyle}
                          className="w-16 text-xs font-semibold rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-red-600/20"
                        />
                        <span className="text-xs" style={{ color: "#9ca3af" }}>pts</span>
                      </div>

                      <button
                        onClick={() => removeQuestion(q.QuestionID)}
                        aria-label="Remove question"
                        className="p-1.5 rounded-md transition-colors hover:bg-red-50"
                        style={{ color: "#9ca3af" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={q.QuestionText}
                    onChange={(e) => updateQuestion(q.QuestionID, "QuestionText", e.target.value)}
                    rows={2}
                    placeholder="Type the question…"
                    style={inputStyle}
                    className="w-full rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button style={{ border: "0.5px solid #e5e7eb", color: "#374151" }} className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors hover:bg-gray-50">
          Save Draft
        </button>
        <button
          onClick={handlePublish}
          disabled={saving}
          style={{ background: "#E02020" }}
          className="text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {saving ? "Publishing…" : "Publish Assignment"}
        </button>
      </div>
    </div>
  );
}