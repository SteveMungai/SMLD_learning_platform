"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Film,
  Presentation,
  Paperclip,
  Download,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  Lock,
} from "lucide-react";
import { Tag, colors } from "./shared";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export interface MaterialItem {
  id: string;
  type: "VIDEO" | "SLIDES" | "NOTES" | "OTHER";
  title: string;
  fileUrl: string;
}

export interface QuestionItem {
  id: string;
  text: string;
  maxScore: number;
  type: "SHORT_ANSWER" | "ESSAY";
}

export interface AnswerItem {
  questionId: string;
  text: string;
  score: number | null;
  feedback: string | null;
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  questions: QuestionItem[];
}

export interface MySubmission {
  id: string;
  status: "SUBMITTED" | "GRADED";
  submittedAt: string;
  grade?: number | null;
  maxScore?: number | null;
  feedback?: string | null;
  answers: AnswerItem[];
}

export interface StudentWeekData {
  id: string;
  weekNumber: number;
  topic: string;
  description?: string | null;
  leader?: string | null;
  passage?: string | null;
  materials: MaterialItem[];
  assignment?: AssignmentItem | null;
  mySubmission?: MySubmission | null;
}

const materialIcon: Record<MaterialItem["type"], LucideIcon> = {
  VIDEO: Film,
  SLIDES: Presentation,
  NOTES: FileText,
  OTHER: Paperclip,
};

export function StudentWeekCard({ week }: { week: StudentWeekData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries((week.mySubmission?.answers ?? []).map((a) => [a.questionId, a.text]))
  );

  const video = week.materials.find((m) => m.type === "VIDEO");
  const documents = week.materials.filter((m) => m.type !== "VIDEO");
  const embedUrl = video ? getYouTubeEmbedUrl(video.fileUrl) : null;
  const hasNotes = documents.length > 0;

  const submission = week.mySubmission ?? null;
  const isSubmitted = !!submission;
  const isGraded = submission?.status === "GRADED";
  const dueDate = week.assignment ? new Date(week.assignment.dueDate) : null;
  const isPastDue = !!dueDate && Date.now() > dueDate.getTime();
  const showForm = !!week.assignment && !isPastDue && !isGraded && (!isSubmitted || editing);

  async function submit() {
    if (!week.assignment) return;
    const unanswered = week.assignment.questions.some((q) => !(drafts[q.id] ?? "").trim());
    if (unanswered) {
      setError("Answer every question before submitting.");
      return;
    }

    setBusy(true);
    setError(null);

    const form = new FormData();
    form.append("assignmentId", week.assignment.id);
    form.append(
      "answers",
      JSON.stringify(
        week.assignment.questions.map((q) => ({ questionId: q.id, answerText: drafts[q.id].trim() }))
      )
    );

    try {
      const res = await fetch("/api/submissions", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't submit. Try again.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
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
          <Tag label={hasNotes ? "Notes" : "No notes yet"} tone={hasNotes ? "red" : "muted"} />
          {video && <Tag label="Video" tone="red" />}
          {week.assignment &&
            (isGraded ? (
              <Tag label="Graded" tone="success" />
            ) : isSubmitted ? (
              <Tag label="Submitted" tone="success" />
            ) : isPastDue ? (
              <Tag label="Past due" tone="red" />
            ) : (
              <Tag label="Assignment due" tone="black" />
            ))}
        </div>

        {week.description && <p className="text-sm text-gray-500 mt-3 max-w-lg">{week.description}</p>}

        {(week.leader || week.passage) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs" style={{ color: colors.muted }}>
            {week.leader && (
              <span>
                Leader: <span className="text-gray-600">{week.leader}</span>
              </span>
            )}
            {week.passage && (
              <span>
                Passage: <span className="text-gray-600">{week.passage}</span>
              </span>
            )}
          </div>
        )}
      </button>

      {open && (
        <div className="col-start-2 mt-5 space-y-6">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Class materials</h4>

            {video && (
              <div className="mb-4">
                {embedUrl ? (
                  <div className="aspect-video rounded-md overflow-hidden">
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
                  </div>
                ) : (
                  <p className="text-sm text-red-600">This video link couldn&apos;t be loaded.</p>
                )}
              </div>
            )}

            {documents.length === 0 ? (
              <p className="text-sm text-gray-500">Your instructor hasn&apos;t uploaded notes for this week yet.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => {
                  const Icon = materialIcon[doc.type];
                  return (
                    <li key={doc.id}>
                      <a
                        href={`/api/materials/${doc.id}/download`}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                        style={{ borderColor: colors.border }}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon size={18} className="text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-800 truncate">{doc.title}</span>
                        </span>
                        <Download size={16} className="text-gray-400 group-hover:text-gray-900 flex-shrink-0" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {week.assignment && dueDate && (
            <section className="rounded-md p-4" style={{ backgroundColor: colors.sectionBg }}>
              <div className="flex items-start gap-2 mb-2">
                <ClipboardList size={18} style={{ color: colors.red }} className="mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{week.assignment.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Due {dueDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at{" "}
                    {dueDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {week.assignment.description && (
                <p className="text-sm text-gray-700 mb-4">{week.assignment.description}</p>
              )}

              {isGraded && submission && (
                <div className="mb-4">
                  <p className="text-sm font-semibold" style={{ color: colors.success }}>
                    Grade: {submission.grade}
                    {submission.maxScore != null ? `/${submission.maxScore}` : ""}
                  </p>
                  {submission.feedback && <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>}
                </div>
              )}

              {isSubmitted && !isGraded && !showForm && (
                <div className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: colors.success }}>
                  <CheckCircle2 size={16} />
                  Submitted. Waiting for your grade.
                </div>
              )}

              {!isSubmitted && isPastDue && (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Lock size={15} />
                  Submissions closed. The due date has passed.
                </div>
              )}

              {isSubmitted && !showForm && (
                <ol className="space-y-3 mb-3">
                  {week.assignment.questions.map((q, i) => {
                    const answer = submission?.answers.find((a) => a.questionId === q.id);
                    return (
                      <li key={q.id} className="text-sm">
                        <p className="text-gray-900 font-medium">
                          {i + 1}. {q.text}
                        </p>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{answer?.text ?? ""}</p>
                        {isGraded && (
                          <p className="text-xs text-gray-500 mt-1">
                            {answer?.score ?? 0}/{q.maxScore}
                            {answer?.feedback ? ` · ${answer.feedback}` : ""}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}

              {showForm && (
                <div className="space-y-4">
                  {week.assignment.questions.map((q, i) => (
                    <div key={q.id}>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        {i + 1}. {q.text} <span className="text-xs text-gray-400">({q.maxScore} pts)</span>
                      </label>
                      <textarea
                        rows={q.type === "ESSAY" ? 6 : 3}
                        value={drafts[q.id] ?? ""}
                        onChange={(e) => {
                          setDrafts((d) => ({ ...d, [q.id]: e.target.value }));
                          setError(null);
                        }}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        style={{ borderColor: colors.border }}
                      />
                    </div>
                  ))}
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={submit}
                      disabled={busy}
                      className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor: colors.black }}
                    >
                      {busy ? "Submitting…" : isSubmitted ? "Save changes" : "Submit assignment"}
                    </button>
                    {editing && (
                      <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-500">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isSubmitted && !isGraded && !isPastDue && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-sm font-medium"
                  style={{ color: colors.red }}
                >
                  Edit answers
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}