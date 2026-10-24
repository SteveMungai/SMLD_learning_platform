"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Film,
  Presentation,
  Paperclip,
  Plus,
  X,
  ClipboardList,
  Circle,
  ChevronDown,
} from "lucide-react";
import { Tag, colors } from "./shared";

export interface MaterialItem {
  id: string;
  type: "VIDEO" | "SLIDES" | "NOTES" | "OTHER";
  title: string;
  fileUrl: string;
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface SubmissionItem {
  id: string;
  studentName: string;
  submittedAt: string | null;
  status: "SUBMITTED" | "GRADED" | null;
  grade: number | null;
}

export interface InstructorWeekData {
  id: string;
  weekNumber: number;
  topic: string;
  description?: string | null;
  leader?: string | null;
  passage?: string | null;
  materials: MaterialItem[];
  assignment?: AssignmentItem | null;
  submissions: SubmissionItem[];
}

type DraftQuestion = { text: string; maxScore: number; type: "SHORT_ANSWER" | "ESSAY" };

const materialIcon: Record<MaterialItem["type"], LucideIcon> = {
  VIDEO: Film,
  SLIDES: Presentation,
  NOTES: FileText,
  OTHER: Paperclip,
};

async function postJson(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.error ?? "Something went wrong. Try again.";
  } catch {
    return "Couldn't reach the server. Try again.";
  }
}

export function InstructorWeekCard({ week }: { week: InstructorWeekData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [busy, setBusy] = useState(false);

  const [formType, setFormType] = useState<"VIDEO" | "NOTES" | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [materialError, setMaterialError] = useState<string | null>(null);

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [aTitle, setATitle] = useState("");
  const [aDesc, setADesc] = useState("");
  const [aDueDate, setADueDate] = useState("");
  const [aDueTime, setADueTime] = useState("23:59");
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { text: "", maxScore: 10, type: "SHORT_ANSWER" },
  ]);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const assignment = week.assignment ?? null;
  const submittedCount = week.submissions.filter((s) => s.status !== null).length;
  const dueDate = assignment ? new Date(assignment.dueDate) : null;
  const isPastDue = !!dueDate && Date.now() > dueDate.getTime();

  async function addMaterial() {
    if (!formType) return;
    if (!newTitle.trim() || !newUrl.trim()) {
      setMaterialError("Add a title and a link.");
      return;
    }
    setBusy(true);
    setMaterialError(null);
    const err = await postJson(`/api/lessons/${week.id}/materials`, {
      type: formType,
      title: newTitle,
      url: newUrl,
    });
    setBusy(false);
    if (err) {
      setMaterialError(err);
      return;
    }
    setNewTitle("");
    setNewUrl("");
    setFormType(null);
    router.refresh();
  }

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  async function postAssignment() {
    if (!aTitle.trim() || !aDueDate) {
      setAssignmentError("Add a title and a due date.");
      return;
    }
    setBusy(true);
    setAssignmentError(null);
    const err = await postJson("/api/instructor/assignments", {
      lessonId: week.id,
      title: aTitle,
      description: aDesc,
      dueDate: new Date(`${aDueDate}T${aDueTime}`).toISOString(),
      questions,
    });
    setBusy(false);
    if (err) {
      setAssignmentError(err);
      return;
    }
    setShowAssignmentForm(false);
    setATitle("");
    setADesc("");
    setADueDate("");
    setQuestions([{ text: "", maxScore: 10, type: "SHORT_ANSWER" }]);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[80px_1fr] gap-x-4 sm:gap-x-6 py-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.red }}>
          Week
        </p>
        <p
          className="text-3xl sm:text-4xl font-bold leading-none"
          style={{ fontFamily: "Georgia, serif", color: colors.black }}
        >
          {String(week.weekNumber).padStart(2, "0")}
        </p>
      </div>

      <button type="button" onClick={() => setOpen((v) => !v)} className="text-left">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
            {week.topic}
          </h3>
          <ChevronDown
            size={18}
            className={`mt-2 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Tag
            label={`${week.materials.length} resource${week.materials.length === 1 ? "" : "s"}`}
            tone={week.materials.length ? "black" : "muted"}
          />
          {assignment ? (
            <Tag
              label={`${submittedCount}/${week.submissions.length} submitted`}
              tone={submittedCount === week.submissions.length ? "success" : "black"}
            />
          ) : (
            <Tag label="No assignment posted" tone="muted" />
          )}
          {assignment && isPastDue && <Tag label="Past due" tone="red" />}
        </div>
      </button>

      {open && (
        <div className="col-start-2 mt-5 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notes & videos</h4>
              <div className="flex gap-4">
                {(["VIDEO", "NOTES"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFormType(t);
                      setNewTitle("");
                      setNewUrl("");
                      setMaterialError(null);
                    }}
                    className="inline-flex items-center gap-1 text-sm font-medium"
                    style={{ color: colors.red }}
                  >
                    <Plus size={15} /> {t === "VIDEO" ? "Video" : "Notes"}
                  </button>
                ))}
              </div>
            </div>

            {week.materials.length > 0 && (
              <ul className="space-y-2 mb-3">
                {week.materials.map((m) => {
                  const Icon = materialIcon[m.type];
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-2.5 rounded-md border px-3 py-2.5"
                      style={{ borderColor: colors.border }}
                    >
                      <Icon size={18} className="text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-800 truncate">{m.title}</span>
                      <span className="ml-auto text-[11px] uppercase tracking-wide text-gray-400">{m.type}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {formType && (
              <div className="rounded-md p-4 space-y-3" style={{ backgroundColor: colors.sectionBg }}>
                <p className="text-xs font-medium text-gray-500">
                  Adding {formType === "VIDEO" ? "a video (replaces the current one)" : "notes"}
                </p>
                <input
                  placeholder={formType === "VIDEO" ? "Title, e.g. Week 3 teaching" : "Title, e.g. Week 3 notes"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: colors.border }}
                />
                <input
                  placeholder={formType === "VIDEO" ? "YouTube link" : "Link to the file"}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: colors.border }}
                />
                {materialError && <p className="text-sm text-red-600">{materialError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addMaterial}
                    disabled={busy}
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: colors.black }}
                  >
                    {busy ? "Adding…" : "Add"}
                  </button>
                  <button type="button" onClick={() => setFormType(null)} className="text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-md p-4" style={{ backgroundColor: colors.sectionBg }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} style={{ color: colors.red }} />
                <h4 className="text-sm font-semibold text-gray-900">Assignment</h4>
              </div>
              {!assignment && !showAssignmentForm && (
                <button
                  type="button"
                  onClick={() => setShowAssignmentForm(true)}
                  className="inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: colors.red }}
                >
                  <Plus size={15} /> Post assignment
                </button>
              )}
            </div>

            {assignment && dueDate && (
              <>
                <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                {assignment.description && <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>}
                <p className="text-xs text-gray-500 mt-2">
                  Due {dueDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at{" "}
                  {dueDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  {isPastDue && (
                    <span className="ml-2 font-medium" style={{ color: colors.red }}>
                      · submissions closed
                    </span>
                  )}
                </p>
              </>
            )}

            {showAssignmentForm && (
              <div className="space-y-3 mt-2">
                <input
                  placeholder="Assignment title"
                  value={aTitle}
                  onChange={(e) => setATitle(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: colors.border }}
                />
                <textarea
                  placeholder="Instructions for students"
                  value={aDesc}
                  onChange={(e) => setADesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: colors.border }}
                />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Questions</p>
                  {questions.map((q, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <textarea
                        placeholder={`Question ${i + 1}`}
                        value={q.text}
                        onChange={(e) => updateQuestion(i, { text: e.target.value })}
                        rows={2}
                        className="flex-1 rounded-md border px-3 py-2 text-sm"
                        style={{ borderColor: colors.border }}
                      />
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(i, { type: e.target.value as DraftQuestion["type"] })}
                        className="rounded-md border px-2 py-2 text-sm"
                        style={{ borderColor: colors.border }}
                      >
                        <option value="SHORT_ANSWER">Short</option>
                        <option value="ESSAY">Essay</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={q.maxScore}
                        onChange={(e) => updateQuestion(i, { maxScore: Number(e.target.value) })}
                        className="w-16 rounded-md border px-2 py-2 text-sm"
                        style={{ borderColor: colors.border }}
                        aria-label="Points"
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                          className="p-2 text-gray-400 hover:text-gray-700"
                          aria-label="Remove question"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuestions((qs) => [...qs, { text: "", maxScore: 10, type: "SHORT_ANSWER" }])}
                    className="inline-flex items-center gap-1 text-sm font-medium"
                    style={{ color: colors.red }}
                  >
                    <Plus size={15} /> Add question
                  </button>
                </div>

                <div className="flex gap-3">
                  <input
                    type="date"
                    value={aDueDate}
                    onChange={(e) => setADueDate(e.target.value)}
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: colors.border }}
                  />
                  <input
                    type="time"
                    value={aDueTime}
                    onChange={(e) => setADueTime(e.target.value)}
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: colors.border }}
                  />
                </div>
                <p className="text-xs text-gray-400">Students can&apos;t submit after this date and time.</p>
                {assignmentError && <p className="text-sm text-red-600">{assignmentError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={postAssignment}
                    disabled={busy}
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: colors.red }}
                  >
                    {busy ? "Posting…" : "Post assignment"}
                  </button>
                  <button type="button" onClick={() => setShowAssignmentForm(false)} className="text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {assignment && (
            <section>
              <button
                type="button"
                onClick={() => setShowSubmissions((v) => !v)}
                className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3"
              >
                {showSubmissions ? "Hide" : "View"} submissions ({submittedCount}/{week.submissions.length})
              </button>
              {showSubmissions && (
                <ul className="divide-y rounded-md border" style={{ borderColor: colors.border }}>
                  {week.submissions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between px-3 py-2.5">
                      <span className="text-sm text-gray-800">{s.studentName}</span>
                      {s.status === "GRADED" ? (
                        <span className="text-sm font-semibold text-gray-900">{s.grade}</span>
                      ) : s.submittedAt ? (
                        <Link
                          href={`/questions/${week.id}/grade`}
                          className="text-xs font-medium px-2.5 py-1 rounded-md border"
                          style={{ borderColor: colors.border, color: colors.red }}
                        >
                          Grade
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Circle size={14} /> Not submitted
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}