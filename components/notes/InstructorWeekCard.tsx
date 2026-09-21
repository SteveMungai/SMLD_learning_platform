"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Film,
  Presentation,
  Paperclip,
  Plus,
  ClipboardList,
  CheckCircle2,
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
  dueDate: string; // ISO — submissions lock after this instant
}

export interface SubmissionItem {
  id: string;
  studentName: string;
  submittedAt: string | null; // null = not submitted yet
  status: "SUBMITTED" | "GRADED" | null; // null = not submitted yet
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
  submissions: SubmissionItem[]; // full cohort roster for this week's assignment
}

const materialIcon: Record<MaterialItem["type"], LucideIcon> = {
  VIDEO: Film,
  SLIDES: Presentation,
  NOTES: FileText,
  OTHER: Paperclip,
};

export function InstructorWeekCard({ week }: { week: InstructorWeekData }) {
  const [open, setOpen] = useState(false);
  const [materials, setMaterials] = useState(week.materials);
  const [assignment, setAssignment] = useState(week.assignment ?? null);
  const [formType, setFormType] = useState<"VIDEO" | "NOTES" | null>(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const [aTitle, setATitle] = useState("");
  const [aDesc, setADesc] = useState("");
  const [aDueDate, setADueDate] = useState("");
  const [aDueTime, setADueTime] = useState("23:59");

  const submittedCount = week.submissions.filter((s) => s.status !== null).length;
  const dueDate = assignment ? new Date(assignment.dueDate) : null;
  const isPastDue = !!dueDate && Date.now() > dueDate.getTime();

  function addMaterial() {
    if (!newTitle || !newUrl || !formType) return;
    setMaterials((m) => [...m, { id: `tmp-${Date.now()}`, title: newTitle, type: formType, fileUrl: newUrl }]);
    setNewTitle("");
    setNewUrl("");
    setFormType(null);
  }

  function postAssignment() {
    if (!aTitle || !aDueDate) return;
    const iso = new Date(`${aDueDate}T${aDueTime}`).toISOString();
    setAssignment({ id: `tmp-${Date.now()}`, title: aTitle, description: aDesc, dueDate: iso });
    setShowAssignmentForm(false);
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
          <h3
            className="text-xl sm:text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {week.topic}
          </h3>
          <ChevronDown
            size={18}
            className={`mt-2 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Tag
            label={`${materials.length} resource${materials.length === 1 ? "" : "s"}`}
            tone={materials.length ? "black" : "muted"}
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
          {/* Materials */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notes & videos</h4>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormType("VIDEO");
                    setNewTitle("");
                    setNewUrl("");
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: colors.red }}
                >
                  <Plus size={15} /> Video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType("NOTES");
                    setNewTitle("");
                    setNewUrl("");
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: colors.red }}
                >
                  <Plus size={15} /> Notes
                </button>
              </div>
            </div>

            {materials.length > 0 && (
              <ul className="space-y-2 mb-3">
                {materials.map((m) => {
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
                  Adding {formType === "VIDEO" ? "a video" : "notes"}
                </p>
                <input
                  placeholder={formType === "VIDEO" ? "Title, e.g. Week 3 teaching" : "Title, e.g. Week 3 notes"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: colors.border }}
                />
                <input
                  placeholder={formType === "VIDEO" ? "YouTube link" : "File link or URL"}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: colors.border }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: colors.black }}
                  >
                    Add
                  </button>
                  <button type="button" onClick={() => setFormType(null)} className="text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Assignment */}
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

            {assignment && !showAssignmentForm && dueDate && (
              <>
                <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Due {dueDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{" "}
                  at {dueDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
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
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: colors.border }}
                />
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
                <p className="text-xs text-gray-400">
                  Students won&apos;t be able to submit after this date and time.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={postAssignment}
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: colors.red }}
                  >
                    Post assignment
                  </button>
                  <button type="button" onClick={() => setShowAssignmentForm(false)} className="text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Submissions */}
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
                        <span className="text-sm font-semibold text-gray-900">{s.grade}/100</span>
                      ) : s.submittedAt ? (
                        <button
                          type="button"
                          className="text-xs font-medium px-2.5 py-1 rounded-md border"
                          style={{ borderColor: colors.border, color: colors.red }}
                        >
                          Grade
                        </button>
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