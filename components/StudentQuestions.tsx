"use client";

import { useMemo, useState } from "react";
import { Clock, Paperclip, X, CheckCircle2, Pencil, Lock, FileText, Download } from "lucide-react";
import type { AssignmentData, AttachmentInfo, SubmissionData, SubmissionAnswerData } from "@/components/types";
import { ACCEPT_ATTR, MAX_FILES, MAX_TOTAL_BYTES, checkFile, formatSize } from "@/lib/attachments";
import { useAutosave } from "@/components/autosave/useAutosave";
import SaveIndicator from "@/components/autosave/SaveIndicator";

type Props = {
  lessonId: string;
  assignment: AssignmentData | null;
  existingSubmission: SubmissionData | null;
  isPreview: boolean;
};

// Only used for the logged-out preview.
const MOCK_ASSIGNMENT: AssignmentData = {
  AssignmentID: "mock-assignment",
  LessonID: "mock-lesson",
  CohortID: "mock-cohort",
  Title: "Week 3 — Pastoral Care Reflection",
  Description: "Reflect on this week's readings and respond to each question in your own words.",
  DeadlineDate: "2030-09-02T23:59:00.000Z",
  Status: "PUBLISHED",
  AcceptLate: false,
  MaxScore: 25,
  questions: [
    { QuestionID: "q1", AssignmentID: "mock-assignment", SequenceOrder: 1, QuestionText: "What does servant leadership look like in a local church context?", QuestionType: "SHORT_ANSWER", MaxScore: 10 },
    { QuestionID: "q2", AssignmentID: "mock-assignment", SequenceOrder: 2, QuestionText: "Describe a boundary you would set as a pastoral caregiver, and why.", QuestionType: "SHORT_ANSWER", MaxScore: 10 },
    { QuestionID: "q3", AssignmentID: "mock-assignment", SequenceOrder: 3, QuestionText: "Summarize the main idea of this week's lesson in 3–4 sentences.", QuestionType: "ESSAY", MaxScore: 5 },
  ],
};

const cardStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb" };
const inputStyle = { background: "#ffffff", border: "0.5px solid #e5e7eb", color: "#111111" };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function StudentQuestionsView({ assignment, existingSubmission, isPreview }: Props) {
  const activeAssignment = assignment ?? (isPreview ? MOCK_ASSIGNMENT : null);

  const [submission, setSubmission] = useState<SubmissionData | null>(existingSubmission);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    existingSubmission?.answers.forEach((a) => (map[a.QuestionID] = a.AnswerText ?? ""));
    return map;
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  // Files already stored on the submission, and which of them the student removed while editing.
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSubmitted = submission?.Status === "SUBMITTED" || submission?.Status === "LATE";
  const isGraded = submission?.grade?.Status === "COMPLETE";
  const late = !!activeAssignment?.DeadlineDate && new Date() > new Date(activeAssignment.DeadlineDate);
  const lateAllowed = late && !!activeAssignment?.AcceptLate;
  const lockedOut = late && !activeAssignment?.AcceptLate; // deadline passed and no late work accepted

  // Autosave only while the student is working on a draft — never on top of a submitted answer.
  const autosave = useAutosave({
    data: answers,
    enabled: !isPreview && !!activeAssignment && !hasSubmitted && !lockedOut,
    save: async (current) => {
      const res = await fetch("/api/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: activeAssignment!.AssignmentID,
          answers: activeAssignment!.questions.map((q) => ({ questionId: q.QuestionID, answerText: current[q.QuestionID] ?? "" })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't save draft.");
      }
    },
  });

  const answeredCount = useMemo(() => Object.values(answers).filter((a) => a.trim().length > 0).length, [answers]);

  if (!activeAssignment) {
    return (
      <div style={cardStyle} className="rounded-xl p-10 text-center">
        <p className="text-sm font-semibold text-gray-900 mb-1">No questions yet</p>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Your lecturer hasn&apos;t published questions for this lesson. Check back soon.
        </p>
      </div>
    );
  }

  const total = activeAssignment.questions.length;
  const answerFor = (qid: string): SubmissionAnswerData | undefined => submission?.answers.find((a) => a.QuestionID === qid);

  const keptExisting = (submission?.attachments ?? []).filter((x) => !removedIds.includes(x.AttachmentID));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again later
    setError(null);

    let next = [...attachments];
    for (const f of picked) {
      const problem = checkFile(f.name, f.size);
      if (problem) return setError(problem);
      if (keptExisting.length + next.length >= MAX_FILES) return setError(`You can attach at most ${MAX_FILES} files.`);
      next = [...next, f];
    }
    if (next.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) {
      return setError(`Files are too large — keep new uploads under ${formatSize(MAX_TOTAL_BYTES)} in total.`);
    }
    setAttachments(next);
  }

  async function handleSubmit() {
    setError(null);
    const a = activeAssignment!;
    const answerList = a.questions.map((q) => ({ questionId: q.QuestionID, answerText: answers[q.QuestionID] ?? "" }));
    const localSubmission = (receipt: string | null, at: string, files: AttachmentInfo[] = [], status: "SUBMITTED" | "LATE" = "SUBMITTED"): SubmissionData => ({
      SubmissionID: submission?.SubmissionID ?? "local",
      AssignmentID: a.AssignmentID,
      StudentID: submission?.StudentID ?? "preview",
      SubmittedAt: at,
      Status: status,
      ReceiptCode: receipt,
      attachments: files,
      grade: null,
      answers: answerList.map((x) => ({
        AnswerID: x.questionId, SubmissionID: "local", QuestionID: x.questionId, AnswerText: x.answerText,
        ScoreAwarded: null, Feedback: null, GradedByID: null, GradedAt: null,
      })),
    });

    if (isPreview) {
      setSubmission(localSubmission(`PREVIEW-${Date.now().toString(36).toUpperCase()}`, new Date().toISOString()));
      setEditing(false);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("assignmentId", a.AssignmentID);
      formData.append("answers", JSON.stringify(answerList));
      attachments.forEach((file) => formData.append("files", file));
      formData.append("removeAttachmentIds", JSON.stringify(removedIds));

      const res = await fetch("/api/submissions", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Submission failed. Please try again.");

      setSubmission(localSubmission(data.ReceiptCode, data.SubmittedAt ?? new Date().toISOString(), data.attachments ?? [], data.Status === "LATE" ? "LATE" : "SUBMITTED"));
      autosave.markSaved();
      setEditing(false);
      setAttachments([]);
      setRemovedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const header = (
    <section style={cardStyle} className="p-6 rounded-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{activeAssignment.Title}</h1>
      {activeAssignment.Description && (
        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>{activeAssignment.Description}</p>
      )}
      {activeAssignment.DeadlineDate && (
        <div
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full"
          style={late ? { background: "rgba(224,32,32,0.1)", color: "#E02020" } : { background: "#f9fafb", color: "#374151" }}
        >
          <Clock size={15} />
          {late ? "Deadline passed — " : "Due "}
          {fmt(activeAssignment.DeadlineDate)}
        </div>
      )}
    </section>
  );

  const fileList = (files: AttachmentInfo[]) => (
    <ul className="space-y-2">
      {files.map((f) => (
        <li key={f.AttachmentID} className="flex items-center justify-between text-sm rounded-lg px-3 py-2" style={{ background: "#f9fafb", border: "0.5px solid #f3f4f6" }}>
          <span className="flex items-center gap-2 min-w-0" style={{ color: "#374151" }}>
            <FileText size={15} style={{ color: "#9ca3af" }} />
            <span className="truncate">{f.FileName}</span>
            {f.FileSizeKB != null && <span className="text-xs flex-shrink-0" style={{ color: "#9ca3af" }}>{formatSize(f.FileSizeKB * 1024)}</span>}
          </span>
          <a href={`/api/attachments/${f.AttachmentID}`} className="flex-shrink-0 ml-3 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#E02020" }}>
            <Download size={13} /> Download
          </a>
        </li>
      ))}
    </ul>
  );

  // ───────────────────────── Review what was submitted ─────────────────────────
  if (hasSubmitted && !editing) {
    const canEdit = !lockedOut && !isGraded;
    const submittedLate = !!submission?.SubmittedAt && !!activeAssignment.DeadlineDate && new Date(submission.SubmittedAt) > new Date(activeAssignment.DeadlineDate);
    return (
      <div className="space-y-8">
        {header}

        <section style={cardStyle} className="p-6 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={28} style={{ color: "#E02020" }} />
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isGraded ? "Graded" : submittedLate ? "Submitted late" : "Submitted"}
                {submission?.SubmittedAt && <span className="font-normal" style={{ color: "#6b7280" }}> · {fmt(submission.SubmittedAt)}</span>}
              </p>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                Receipt <span className="font-mono font-semibold text-gray-700">{submission?.ReceiptCode}</span>
              </p>
            </div>
          </div>
          {isGraded && submission?.grade && (
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {submission.grade.TotalScore ?? 0}
                <span className="text-sm font-semibold" style={{ color: "#9ca3af" }}> / {submission.grade.MaxPossibleScore ?? activeAssignment.MaxScore ?? 0}</span>
              </p>
            </div>
          )}
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ border: "0.5px solid #e5e7eb", color: "#374151" }}
            >
              <Pencil size={14} /> Edit submission
            </button>
          )}
        </section>

        {isGraded && submission?.grade?.OverallFeedback && (
          <section className="p-5 rounded-xl text-sm" style={{ background: "rgba(224,32,32,0.05)", color: "#7f1d1d" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1">Lecturer feedback</p>
            {submission.grade.OverallFeedback}
          </section>
        )}

        {(submission?.attachments.length ?? 0) > 0 && (
          <section style={cardStyle} className="p-6 rounded-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Attached files</h3>
            {fileList(submission!.attachments)}
          </section>
        )}

        <div className="space-y-5">
          {activeAssignment.questions.map((q) => {
            const a = answerFor(q.QuestionID);
            return (
              <div key={q.QuestionID} style={cardStyle} className="p-6 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mt-0.5" style={{ background: "rgba(224,32,32,0.1)", color: "#E02020" }}>
                      {q.SequenceOrder}
                    </span>
                    <p className="text-[15px] font-semibold text-gray-900 leading-relaxed">{q.QuestionText}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-semibold ml-3" style={{ color: "#9ca3af" }}>
                    {isGraded && a?.ScoreAwarded != null ? `${a.ScoreAwarded} / ${q.MaxScore}` : `${q.MaxScore} pts`}
                  </span>
                </div>
                <div className="ml-10 rounded-lg px-4 py-3 text-sm whitespace-pre-wrap" style={{ background: "#f9fafb", color: "#111111" }}>
                  {a?.AnswerText?.trim() ? a.AnswerText : <span style={{ color: "#9ca3af" }}>No answer given.</span>}
                </div>
                {isGraded && a?.Feedback && (
                  <p className="ml-10 mt-2 text-xs" style={{ color: "#6b7280" }}>Feedback: {a.Feedback}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ───────────────────────────── Answer (draft) form ─────────────────────────────
  const locked = lockedOut;
  return (
    <div className="space-y-8">
      {header}

      {locked && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>
          <Lock size={15} />
          The deadline has passed, so answers can no longer be changed{submission && !hasSubmitted ? " — your saved draft was not submitted" : ""}.
        </div>
      )}

      {lateAllowed && !locked && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(245,158,11,0.1)", color: "#92400e" }}>
          The deadline has passed. Your lecturer is still accepting work, but it will be marked <strong>late</strong>.
        </div>
      )}

      {editing && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "#f9fafb", color: "#374151" }}>
          You&apos;re editing a submitted assignment. Changes aren&apos;t saved until you resubmit.{" "}
          <button
            className="font-semibold underline"
            onClick={() => {
              const map: Record<string, string> = {};
              submission?.answers.forEach((a) => (map[a.QuestionID] = a.AnswerText ?? ""));
              setAnswers(map);
              setAttachments([]);
              setRemovedIds([]);
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 text-sm" style={{ color: "#6b7280" }}>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
          <div className="h-full transition-all duration-300" style={{ width: `${total ? (answeredCount / total) * 100 : 0}%`, background: "#E02020" }} />
        </div>
        <span className="font-semibold text-gray-900">{answeredCount}/{total} answered</span>
      </div>

      <div className="space-y-5">
        {activeAssignment.questions.map((q) => (
          <div key={q.QuestionID} style={cardStyle} className="p-6 rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mt-0.5" style={{ background: "rgba(224,32,32,0.1)", color: "#E02020" }}>
                  {q.SequenceOrder}
                </span>
                <p className="text-[15px] font-semibold text-gray-900 leading-relaxed">{q.QuestionText}</p>
              </div>
              <span className="flex-shrink-0 text-xs font-semibold ml-3" style={{ color: "#9ca3af" }}>{q.MaxScore} pts</span>
            </div>
            <textarea
              value={answers[q.QuestionID] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.QuestionID]: e.target.value }))}
              rows={4}
              disabled={locked}
              placeholder="Type your answer here…"
              style={inputStyle}
              className="rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-y ml-10 w-[calc(100%-2.5rem)] disabled:bg-gray-50"
            />
          </div>
        ))}
      </div>

      {!locked && (
        <section style={cardStyle} className="p-6 rounded-xl">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Attach files (optional)</h3>
          <p className="text-xs mb-3" style={{ color: "#9ca3af" }}>
            Up to {MAX_FILES} files, {formatSize(MAX_TOTAL_BYTES)} in total (PDF, Word, PowerPoint, Excel, text or images). Files are uploaded when you submit — they aren&apos;t part of draft autosave.
          </p>
          {keptExisting.length > 0 && (
            <ul className="mb-3 space-y-2">
              {keptExisting.map((f) => (
                <li key={f.AttachmentID} style={{ background: "#f9fafb", border: "0.5px solid #f3f4f6" }} className="flex items-center justify-between text-sm rounded-lg px-3 py-2">
                  <span className="truncate" style={{ color: "#374151" }}>{f.FileName} <span className="text-xs" style={{ color: "#9ca3af" }}>(already uploaded)</span></span>
                  <button onClick={() => setRemovedIds((p) => [...p, f.AttachmentID])} aria-label={`Remove ${f.FileName}`} style={{ color: "#9ca3af" }}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label
            style={{ border: "0.5px solid #e5e7eb", color: "#374151" }}
            className="inline-flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2.5 cursor-pointer transition-colors hover:bg-gray-50"
          >
            <Paperclip size={16} />
            Choose files
            <input type="file" multiple accept={ACCEPT_ATTR} onChange={handleFileChange} className="hidden" />
          </label>
          {attachments.length > 0 && (
            <ul className="mt-4 space-y-2">
              {attachments.map((file, i) => (
                <li key={`${file.name}-${i}`} style={{ background: "#f9fafb", border: "0.5px solid #f3f4f6" }} className="flex items-center justify-between text-sm rounded-lg px-3 py-2">
                  <span className="truncate" style={{ color: "#374151" }}>{file.name} <span className="text-xs" style={{ color: "#9ca3af" }}>{formatSize(file.size)}</span></span>
                  <button onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} aria-label={`Remove ${file.name}`} style={{ color: "#9ca3af" }}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {error && (
        <p className="text-sm px-4 py-3 rounded-lg" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>{error}</p>
      )}

      {!locked && (
        <div className="flex items-center justify-between gap-3">
          {!isPreview && !hasSubmitted ? <SaveIndicator state={autosave.state} lastSavedAt={autosave.lastSavedAt} message={autosave.errorMessage} /> : <span />}
          <div className="flex items-center gap-3">
            {!isPreview && !hasSubmitted && (
              <button
                onClick={() => void autosave.flush()}
                className="text-sm font-semibold px-5 py-3 rounded-lg transition-colors hover:bg-gray-50"
                style={{ border: "0.5px solid #e5e7eb", color: "#374151" }}
              >
                Save draft
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: "#E02020" }}
              className="text-sm font-semibold text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting…" : editing ? "Resubmit" : "Submit Assignment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
