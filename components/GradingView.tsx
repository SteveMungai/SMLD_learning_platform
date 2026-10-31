"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MakeupNoticeDialog from "@/components/MakeupNoticeDialog";
import { User, Search, Mail, FileText, Download, AlertTriangle, ChevronLeft } from "lucide-react";
import { formatSize } from "@/lib/attachments";
import type { GradingAssignmentData, GradableSubmission, MissingStudent } from "@/components/types";

type Props = {
  assignment: GradingAssignmentData;
  initialQuery?: string;
};

type Filter = "all" | "ungraded" | "graded" | "late" | "ontime" | "missing";

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

// "1", "0.5" — never "1.0000000001"
const num = (n: number) => String(Math.round(n * 100) / 100);

export default function GradingView({ assignment, initialQuery = "" }: Props) {
  const [submissions, setSubmissions] = useState<GradableSubmission[]>(assignment.submissions);
  const missing = assignment.missing;

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  // "s:<submissionId>" for a handed-in submission, "m:<studentId>" for someone who hasn't submitted.
  const [selectedKey, setSelectedKey] = useState<string | null>(
    submissions[0] ? `s:${submissions[0].SubmissionID}` : missing[0] ? `m:${missing[0].StudentID}` : null
  );
  const [noticeOpen, setNoticeOpen] = useState(false);

  // Drafts keyed by submissionId so switching between students doesn't lose unsaved edits.
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, Record<string, string>>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, Record<string, string>>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGraded = (s: GradableSubmission) => s.grade?.Status === "COMPLETE";

  //counts, search and filter 
  const counts = useMemo(
    () => ({
      all: submissions.length + missing.length,
      ungraded: submissions.filter((s) => !isGraded(s)).length,
      graded: submissions.filter(isGraded).length,
      late: submissions.filter((s) => s.IsLate).length,
      ontime: submissions.filter((s) => !s.IsLate).length,
      missing: missing.length,
    }),
    [submissions, missing]
  );

  const q = query.trim().toLowerCase();
  const matches = (name: string, email: string) => !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);

  const visibleSubmissions = submissions.filter((s) => {
    if (filter === "missing") return false;
    if (filter === "ungraded" && isGraded(s)) return false;
    if (filter === "graded" && !isGraded(s)) return false;
    if (filter === "late" && !s.IsLate) return false;
    if (filter === "ontime" && s.IsLate) return false;
    return matches(s.StudentName, s.StudentEmail);
  });
  const showMissing = filter === "all" || filter === "missing";
  const visibleMissing = showMissing ? missing.filter((m) => matches(m.StudentName, m.StudentEmail)) : [];

  const selectedSubmission = selectedKey?.startsWith("s:") ? submissions.find((s) => s.SubmissionID === selectedKey.slice(2)) ?? null : null;
  const selectedMissing = selectedKey?.startsWith("m:") ? missing.find((m) => m.StudentID === selectedKey.slice(2)) ?? null : null;
  const selected = selectedSubmission;

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "ungraded", label: "Ungraded" },
    { id: "graded", label: "Graded" },
    { id: "late", label: "Late" },
    { id: "ontime", label: "On time" },
    { id: "missing", label: "Missing" },
  ];

  // score / comment helpers 
  const findAnswer = (s: GradableSubmission, qid: string) => s.answers.find((a) => a.QuestionID === qid);

  function getScoreDraft(sid: string, qid: string, fallback: number | null) {
    const draft = scoreDrafts[sid]?.[qid];
    if (draft !== undefined) return draft;
    return fallback !== null ? String(fallback) : "";
  }
  function setScoreDraft(sid: string, qid: string, value: string) {
    setScoreDrafts((prev) => ({ ...prev, [sid]: { ...prev[sid], [qid]: value } }));
  }
  function getCommentDraft(sid: string, qid: string, fallback: string | null) {
    return commentDrafts[sid]?.[qid] ?? fallback ?? "";
  }
  function setCommentDraft(sid: string, qid: string, value: string) {
    setCommentDrafts((prev) => ({ ...prev, [sid]: { ...prev[sid], [qid]: value } }));
  }
  const getFeedbackDraft = (s: GradableSubmission) => feedbackDrafts[s.SubmissionID] ?? s.grade?.OverallFeedback ?? "";

  const maxPossibleScore = assignment.questions.reduce((sum, qn) => sum + qn.MaxScore, 0);

  function currentScore(s: GradableSubmission, qid: string) {
    const raw = getScoreDraft(s.SubmissionID, qid, findAnswer(s, qid)?.ScoreAwarded ?? null);
    const n = Number(raw);
    return raw !== "" && Number.isFinite(n) ? n : null;
  }
  const computeTotal = (s: GradableSubmission) => assignment.questions.reduce((sum, qn) => sum + (currentScore(s, qn.QuestionID) ?? 0), 0);

  // Starter text for a comment, e.g. "You missed 1 point out of the possible 3 for question 2: "
  function insertScoreNote(s: GradableSubmission, qn: GradingAssignmentData["questions"][number]) {
    const score = currentScore(s, qn.QuestionID) ?? 0;
    const missed = Math.max(0, qn.MaxScore - score);
    const existing = getCommentDraft(s.SubmissionID, qn.QuestionID, findAnswer(s, qn.QuestionID)?.Feedback ?? null);
    if (/^You missed/.test(existing)) return;
    const note = `You missed ${num(missed)} point${missed === 1 ? "" : "s"} out of the possible ${num(qn.MaxScore)} for question ${qn.SequenceOrder}: `;
    setCommentDraft(s.SubmissionID, qn.QuestionID, note + existing);
  }

  async function handlePublish() {
    if (!selected) return;
    setError(null);
    setPublishing(true);

    try {
      const answers = assignment.questions.map((qn) => ({
        questionId: qn.QuestionID,
        score: currentScore(selected, qn.QuestionID) ?? 0,
        comment: getCommentDraft(selected.SubmissionID, qn.QuestionID, findAnswer(selected, qn.QuestionID)?.Feedback ?? null),
      }));

      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: selected.SubmissionID, answers, overallFeedback: getFeedbackDraft(selected) }),
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
                answers: s.answers.map((a) => {
                  const saved = (data.answers ?? []).find((x: { questionId: string }) => x.questionId === a.QuestionID);
                  return saved ? { ...a, ScoreAwarded: saved.score, Feedback: saved.comment } : a;
                }),
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
      // Drafts are now saved; drop them so the saved values show.
      setScoreDrafts((p) => ({ ...p, [selected.SubmissionID]: {} }));
      setCommentDrafts((p) => ({ ...p, [selected.SubmissionID]: {} }));
      setFeedbackDrafts((p) => {
        const { [selected.SubmissionID]: _drop, ...rest } = p;
        void _drop;
        return rest;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPublishing(false);
    }
  }

  const lateList = submissions.filter((s) => s.IsLate);
  const deadlineText = formatSubmittedAt(assignment.DeadlineDate);

  const nameBadge = (valid: boolean) =>
    valid ? null : (
      <span title="This name doesn't look like a real full name, which is needed for the certificate." className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}>
        <AlertTriangle size={10} /> Check name
      </span>
    );

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />

      {/* Header */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-8">
        <Link href="/grades" className="inline-flex items-center gap-1 text-xs font-semibold mb-3" style={{ color: "#6b7280" }}>
          <ChevronLeft size={14} /> All lessons
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#E02020" }}>{assignment.lesson.CourseTitle}</p>
            <h1 className="text-2xl font-bold text-gray-900">Lesson {assignment.lesson.SequenceOrder}: {assignment.lesson.Title}</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              {assignment.Title} · due {deadlineText}
              {assignment.AcceptLate ? " · late submissions accepted" : ""}
            </p>
          </div>
          <button
            onClick={() => setNoticeOpen(true)}
            disabled={missing.length + lateList.length === 0}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ border: "0.5px solid #e5e7eb", color: "#374151" }}
          >
            <Mail size={15} /> Email makeup notice
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 text-xs font-semibold">
          {[
            ["Submitted", `${submissions.length}/${submissions.length + missing.length}`],
            ["Graded", String(counts.graded)],
            ["Ungraded", String(counts.ungraded)],
            ["Late", String(counts.late)],
            ["Not submitted", String(counts.missing)],
          ].map(([label, value]) => (
            <span key={label} className="px-3 py-1 rounded-full" style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#374151" }}>
              {label}: <span className="text-gray-900">{value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full mt-6" style={{ borderTop: "0.5px solid #e5e7eb" }}>
        {/* Left — search, filters, student list */}
        <aside className="w-80 shrink-0 border-r px-4 py-6" style={{ borderColor: "#e5e7eb" }}>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              aria-label="Search students"
              style={{ border: "0.5px solid #e5e7eb", color: "#111111" }}
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Filter submissions">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
                style={filter === f.id ? { background: "#111111", color: "#fff" } : { background: "#f3f4f6", color: "#4b5563" }}
              >
                {f.label} <span style={{ opacity: 0.6 }}>{counts[f.id]}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {visibleSubmissions.map((s) => {
              const isSelected = selectedKey === `s:${s.SubmissionID}`;
              const graded = isGraded(s);
              return (
                <button
                  key={s.SubmissionID}
                  onClick={() => setSelectedKey(`s:${s.SubmissionID}`)}
                  style={{ ...cardStyle, borderColor: isSelected ? "#E02020" : "#e5e7eb" }}
                  className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#6b7280" }}>
                      <User size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.StudentName}</p>
                      <p className="text-xs truncate" style={{ color: "#9ca3af" }}>{s.StudentEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                      style={graded ? { background: "rgba(16,185,129,0.1)", color: "#059669" } : { background: "#f3f4f6", color: "#6b7280" }}
                    >
                      {graded ? "Graded" : "Ungraded"}
                    </span>
                    {s.IsLate && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "#111111", color: "#fff" }}>Late</span>
                    )}
                  </div>
                </button>
              );
            })}

            {visibleMissing.length > 0 && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest pt-3 pb-1" style={{ color: "#9ca3af" }}>Not submitted</p>
                {visibleMissing.map((m) => {
                  const isSelected = selectedKey === `m:${m.StudentID}`;
                  return (
                    <button
                      key={m.StudentID}
                      onClick={() => setSelectedKey(`m:${m.StudentID}`)}
                      style={{ ...cardStyle, borderColor: isSelected ? "#E02020" : "#e5e7eb" }}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#6b7280" }}>{m.StudentName}</p>
                        <p className="text-xs truncate" style={{ color: "#9ca3af" }}>{m.StudentEmail}</p>
                      </div>
                      <span className="flex-shrink-0 ml-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: "rgba(224,32,32,0.08)", color: "#E02020" }}>Missing</span>
                    </button>
                  );
                })}
              </>
            )}

            {visibleSubmissions.length === 0 && visibleMissing.length === 0 && (
              <p className="text-sm px-2 py-4" style={{ color: "#9ca3af" }}>
                {submissions.length + missing.length === 0 ? "No students in this cohort yet." : "No students match your search or filter."}
              </p>
            )}
          </div>
        </aside>

        {/* Center — questions, answers, per-question scores and comments */}
        <main className="flex-1 px-8 py-8 min-w-0">
          {selectedMissing ? (
            <MissingPanel student={selectedMissing} nameBadge={nameBadge} assignmentTitle={assignment.Title} />
          ) : !selected ? (
            <p className="text-sm" style={{ color: "#9ca3af" }}>Select a student to view their submission.</p>
          ) : (
            <div className="space-y-8 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{selected.StudentName}</h2>
                {nameBadge(selected.NameValid)}
                <span className="text-xs" style={{ color: "#9ca3af" }}>{selected.StudentEmail}</span>
              </div>

              {assignment.questions.map((qn) => {
                const ans = findAnswer(selected, qn.QuestionID);
                const score = currentScore(selected, qn.QuestionID);
                const comment = getCommentDraft(selected.SubmissionID, qn.QuestionID, ans?.Feedback ?? null);
                return (
                  <div key={qn.QuestionID}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-[15px] font-semibold text-gray-900">
                        {qn.SequenceOrder}. {qn.QuestionText}{" "}
                        <span className="font-normal" style={{ color: "#9ca3af" }}>({qn.MaxScore} mrk{qn.MaxScore !== 1 ? "s" : ""})</span>
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={qn.MaxScore}
                          step="any"
                          value={getScoreDraft(selected.SubmissionID, qn.QuestionID, ans?.ScoreAwarded ?? null)}
                          onChange={(e) => setScoreDraft(selected.SubmissionID, qn.QuestionID, e.target.value)}
                          aria-label={`Score for question ${qn.SequenceOrder}`}
                          style={{ border: "0.5px solid #e5e7eb", color: "#111111" }}
                          className="w-14 text-xs font-semibold rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-red-600/20"
                        />
                        <span className="text-xs" style={{ color: "#9ca3af" }}>/ {qn.MaxScore}</span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed pl-5 whitespace-pre-wrap" style={{ color: "#374151" }}>
                      {ans?.AnswerText?.trim() ? ans.AnswerText : <span style={{ color: "#d1d5db" }}>No answer provided.</span>}
                    </p>

                    {/* Comment after every question */}
                    <div className="pl-5 mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor={`c-${qn.QuestionID}`} className="text-xs font-semibold" style={{ color: "#9ca3af" }}>Comment for student</label>
                        {score !== null && score < qn.MaxScore && (
                          <button
                            type="button"
                            onClick={() => insertScoreNote(selected, qn)}
                            className="text-xs font-semibold"
                            style={{ color: "#E02020" }}
                          >
                            Add “missed {num(qn.MaxScore - score)} of {num(qn.MaxScore)}” note
                          </button>
                        )}
                      </div>
                      <textarea
                        id={`c-${qn.QuestionID}`}
                        value={comment}
                        onChange={(e) => setCommentDraft(selected.SubmissionID, qn.QuestionID, e.target.value)}
                        rows={2}
                        maxLength={1000}
                        placeholder="e.g. You missed 1 point out of the possible 3 for not explaining …"
                        style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#111111" }}
                        className="w-full rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-y"
                      />
                    </div>
                  </div>
                );
              })}

              {selected.attachments.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-2">Attached files</h3>
                  <ul className="space-y-2">
                    {selected.attachments.map((f) => (
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
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right — submission meta, overall feedback, score, publish */}
        {selected && (
          <aside className="w-80 shrink-0 border-l px-6 py-8" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#9ca3af" }}>Submission time</p>
            <p className="text-sm font-semibold text-gray-900 mb-2">{formatSubmittedAt(selected.SubmittedAt)}</p>
            {selected.IsLate ? (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded mb-6" style={{ background: "#111111", color: "white" }}>Late</span>
            ) : (
              <div className="mb-6" />
            )}

            <p className="text-xs font-semibold mb-2" style={{ color: "#9ca3af" }}>Overall feedback</p>
            <textarea
              value={getFeedbackDraft(selected)}
              onChange={(e) => setFeedbackDrafts((prev) => ({ ...prev, [selected.SubmissionID]: e.target.value }))}
              rows={6}
              placeholder="Leave overall feedback for the student…"
              style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#111111" }}
              className="w-full rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-none mb-6"
            />

            <p className="text-xs font-semibold mb-2" style={{ color: "#9ca3af" }}>Assessment Score</p>
            <div style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb" }} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-900 mb-6">
              {num(computeTotal(selected))}/{num(maxPossibleScore)}
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg mb-4" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>{error}</p>
            )}

            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{ background: "#111111" }}
              className="w-full text-sm font-semibold text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {publishing ? "Publishing…" : isGraded(selected) ? "Update grade" : "Publish grade"}
            </button>
          </aside>
        )}
      </div>

      {noticeOpen && (
        <MakeupNoticeDialog
          lessonId={assignment.LessonID}
          assignmentTitle={assignment.Title}
          missing={missing}
          late={lateList}
          onClose={() => setNoticeOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
}

function MissingPanel({
  student,
  nameBadge,
  assignmentTitle,
}: {
  student: MissingStudent;
  nameBadge: (valid: boolean) => React.ReactNode;
  assignmentTitle: string;
}) {
  return (
    <div className="max-w-xl rounded-xl p-8" style={cardStyle}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h2 className="text-lg font-bold text-gray-900">{student.StudentName}</h2>
        {nameBadge(student.NameValid)}
      </div>
      <p className="text-sm mb-1" style={{ color: "#6b7280" }}>{student.StudentEmail}</p>
      <p className="text-sm mt-4" style={{ color: "#374151" }}>
        Hasn&apos;t submitted <span className="font-semibold">{assignmentTitle}</span>. Use <span className="font-semibold">Email makeup notice</span> above to send feedback to everyone who&apos;s missing or late.
      </p>
    </div>
  );
}
