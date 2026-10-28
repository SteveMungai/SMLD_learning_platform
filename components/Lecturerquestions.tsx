"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { AssignmentData } from "@/components/types";
import { useAutosave } from "@/components/autosave/useAutosave";
import SaveIndicator from "@/components/autosave/SaveIndicator";

type Props = {
  lessonId: string;
  assignment: AssignmentData | null;
  isPreview: boolean;
};

type QuestionDraft = {
  key: string; // stable React key, independent of the database ID
  QuestionText: string;
  QuestionType: "SHORT_ANSWER" | "ESSAY";
  MaxScore: number;
};

const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };
const inputStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb", color: "#111111" };

const pad = (n: number) => String(n).padStart(2, "0");
function isoToLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const localInputToIso = (v: string) => (v ? new Date(v).toISOString() : null);

export default function LecturerQuestionsView({ lessonId, assignment, isPreview }: Props) {
  const [title, setTitle] = useState(assignment?.Title ?? "");
  const [deadline, setDeadline] = useState(isoToLocalInput(assignment?.DeadlineDate));
  const [description, setDescription] = useState(assignment?.Description ?? "");
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    assignment?.questions.length
      ? assignment.questions.map((q) => ({ key: q.QuestionID, QuestionText: q.QuestionText, QuestionType: q.QuestionType, MaxScore: q.MaxScore }))
      : [{ key: crypto.randomUUID(), QuestionText: "", QuestionType: "SHORT_ANSWER", MaxScore: 10 }]
  );

  const ids = useRef<Record<string, string>>(
    Object.fromEntries((assignment?.questions ?? []).map((q) => [q.QuestionID, q.QuestionID]))
  );

  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | null>(assignment?.Status ?? null);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPublished = status === "PUBLISHED";
  const totalMaxScore = questions.reduce((sum, q) => sum + (Number(q.MaxScore) || 0), 0);

  type FormData = { title: string; deadline: string; description: string; questions: QuestionDraft[] };

  async function persist(form: FormData, publish: boolean) {
    const res = await fetch("/api/assignments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        publish,
        title: form.title,
        description: form.description,
        deadlineDate: localInputToIso(form.deadline),
        questions: form.questions.map((q) => ({
          id: ids.current[q.key] ?? null,
          QuestionText: q.QuestionText,
          QuestionType: q.QuestionType,
          MaxScore: q.MaxScore,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Failed to save the assignment.");
    // Remember the IDs the server gave newly created questions (same order as sent).
    form.questions.forEach((q, i) => {
      const saved = data.questions?.[i]?.QuestionID;
      if (saved) ids.current[q.key] = saved;
    });
    setStatus(data.Status);
  }

  // Autosave writes drafts only. A published assignment is live to students, so edits to it
  // are saved explicitly with "Save changes" instead of on every keystroke.
  const autosave = useAutosave<FormData>({
    data: { title, deadline, description, questions },
    enabled: !isPreview && !isPublished,
    save: (form) => persist(form, false),
  });

  function addQuestion() {
    setQuestions((prev) => [...prev, { key: crypto.randomUUID(), QuestionText: "", QuestionType: "SHORT_ANSWER", MaxScore: 10 }]);
  }
  function removeQuestion(key: string) {
    setQuestions((prev) => prev.filter((q) => q.key !== key));
  }
  function updateQuestion<K extends keyof QuestionDraft>(key: string, field: K, value: QuestionDraft[K]) {
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, [field]: value } : q)));
  }

  async function handlePublish() {
    setError(null);
    setNotice(null);
    if (isPreview) {
      setNotice("Preview only — nothing was saved. Log in to publish for real.");
      return;
    }
    setPublishing(true);
    try {
      if (!isPublished) await autosave.flush(); // let any in-flight draft save land first
      await persist({ title, deadline, description, questions }, true);
      autosave.markSaved();
      setNotice(isPublished ? "Changes saved." : "Assignment published — students in this cohort can now see it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleSaveDraft() {
    setError(null);
    if (isPreview) {
      setNotice("Preview only — nothing was saved. Log in to save drafts.");
      return;
    }
    setNotice(null);
    await autosave.flush();
  }

  return (
    <div className="space-y-10">
      {notice && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>{notice}</div>
      )}

      <section style={cardStyle} className="p-6 rounded-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Assignment Details</h2>
            {!isPreview && (
              <span
                className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={isPublished ? { background: "rgba(22,163,74,0.1)", color: "#15803d" } : { background: "#f3f4f6", color: "#6b7280" }}
              >
                {isPublished ? "Published" : "Draft"}
              </span>
            )}
          </div>
          {isPublished && (
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
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Title</label>
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
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={inputStyle}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Description</label>
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
          <button onClick={addQuestion} className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors" style={{ background: "#111111" }}>
            <Plus size={16} />
            Add Question
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.key} style={cardStyle} className="p-5 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center pt-2" style={{ color: "#d1d5db" }}>
                  <GripVertical size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold" style={{ background: "rgba(224,32,32,0.1)", color: "#E02020" }}>
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <select
                        value={q.QuestionType}
                        onChange={(e) => updateQuestion(q.key, "QuestionType", e.target.value as QuestionDraft["QuestionType"])}
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
                          onChange={(e) => updateQuestion(q.key, "MaxScore", Number(e.target.value))}
                          style={inputStyle}
                          className="w-16 text-xs font-semibold rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-red-600/20"
                        />
                        <span className="text-xs" style={{ color: "#9ca3af" }}>pts</span>
                      </div>
                      <button onClick={() => removeQuestion(q.key)} aria-label="Remove question" className="p-1.5 rounded-md transition-colors hover:bg-red-50" style={{ color: "#9ca3af" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={q.QuestionText}
                    onChange={(e) => updateQuestion(q.key, "QuestionText", e.target.value)}
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
        <p className="text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>{error}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        {!isPreview && !isPublished ? (
          <SaveIndicator state={autosave.state} lastSavedAt={autosave.lastSavedAt} message={autosave.errorMessage} />
        ) : (
          <span className="text-xs" style={{ color: "#9ca3af" }}>
            {isPublished ? "Live to students — changes apply when you save." : ""}
          </span>
        )}
        <div className="flex items-center gap-3">
          {!isPublished && (
            <button
              onClick={handleSaveDraft}
              style={{ border: "0.5px solid #e5e7eb", color: "#374151" }}
              className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors hover:bg-gray-50"
            >
              Save Draft
            </button>
          )}
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{ background: "#E02020" }}
            className="text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {publishing ? "Saving…" : isPublished ? "Save changes" : "Publish Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
