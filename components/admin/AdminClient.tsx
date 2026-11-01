"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Result } from "@/lib/admin";
import {
  addMembersByEmail, createCohort, deleteLesson, moveLesson, renameLesson,
  setLessonLecturer, setMembership, setRole, updateCohort,
} from "@/app/admin/actions";

const BORDER = { border: "0.5px solid #e5e7eb" } as const;
const FIELD = "w-full rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900";
const BTN = "rounded-lg px-3 py-2 text-xs font-semibold bg-white text-gray-900 disabled:opacity-50";
const BTN_RED = "rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
const ROLE_LABEL = { STUDENT: "Student", INSTRUCTOR: "Lecturer", ADMIN: "Admin" } as const;

/** Runs a server action, shows its message or error, and refreshes the page data. */
function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const run = (fn: () => Promise<Result>, after?: (r: Result) => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r);
      if (!r.error) {
        router.refresh();
        after?.(r);
      }
    });
  return { pending, msg, run };
}

function Status({ msg }: { msg: Result | null }) {
  if (!msg) return null;
  if (msg.error) return <p role="alert" className="text-xs font-medium" style={{ color: "#b91c1c" }}>{msg.error}</p>;
  return msg.message ? <p role="status" className="text-xs" style={{ color: "#374151" }}>{msg.message}</p> : null;
}

// Users
export function UserPanel({
  user, memberships, allCohorts, isSelf,
}: {
  user: { id: string; name: string; email: string; role: "STUDENT" | "INSTRUCTOR" | "ADMIN"; joined: string };
  memberships: { id: string; name: string }[];
  allCohorts: { id: string; name: string }[];
  isSelf: boolean;
}) {
  const { pending, msg, run } = useAction();
  const [role, setRoleState] = useState(user.role);
  const [cohortId, setCohortId] = useState("");
  const joinedIds = new Set(memberships.map((m) => m.id));
  const available = allCohorts.filter((c) => !joinedIds.has(c.id));

  return (
    <div className="rounded-xl p-5 flex flex-col gap-4 text-sm" style={BORDER}>
      <div>
        <p className="text-base font-bold text-gray-900">{user.name}</p>
        <p className="text-xs" style={{ color: "#6b7280" }}>{user.email} · Joined {user.joined}</p>
      </div>

      <label className="text-xs font-semibold" style={{ color: "#6b7280" }}>
        Role
        <select className={`${FIELD} mt-1.5`} style={BORDER} value={role} disabled={isSelf || pending}
          onChange={(e) => setRoleState(e.target.value as typeof role)}>
          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {isSelf ? (
        <p className="text-xs" style={{ color: "#6b7280" }}>You can&apos;t change your own role.</p>
      ) : (
        <button className={BTN_RED} style={{ background: "#E02020" }} disabled={pending || role === user.role}
          onClick={() => {
            if (!confirm(`Change ${user.name} to ${ROLE_LABEL[role]}? They will be signed out so the new role applies.`)) return;
            run(() => setRole(user.id, role));
          }}>
          Save role
        </button>
      )}

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "#6b7280" }}>Cohorts</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {memberships.length === 0 && <span className="text-xs" style={{ color: "#6b7280" }}>Not in any cohort.</span>}
          {memberships.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ background: "#f3f4f6" }}>
              {m.name}
              <button aria-label={`Remove from ${m.name}`} disabled={pending} className="font-bold"
                onClick={() => run(() => setMembership(user.id, m.id, false))}>×</button>
            </span>
          ))}
        </div>
        {available.length > 0 && (
          <div className="flex gap-2">
            <select aria-label="Cohort to add" className={FIELD} style={BORDER} value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
              <option value="">Add to cohort…</option>
              {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className={BTN} style={BORDER} disabled={pending || !cohortId}
              onClick={() => run(() => setMembership(user.id, cohortId, true), () => setCohortId(""))}>Add</button>
          </div>
        )}
      </div>
      <Status msg={msg} />
    </div>
  );
}

// Cohorts
export function CreateCohortForm() {
  const router = useRouter();
  const { pending, msg, run } = useAction();
  const [f, setF] = useState({ name: "", year: "", desc: "" });
  return (
    <details className="rounded-xl p-4" style={BORDER}>
      <summary className="cursor-pointer text-sm font-semibold" style={{ color: "#E02020" }}>New cohort</summary>
      <div className="grid gap-3 mt-4 sm:grid-cols-2">
        <input aria-label="Cohort name" placeholder="Cohort name" className={FIELD} style={BORDER} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input aria-label="Academic year" placeholder="Academic year, e.g. 2027" className={FIELD} style={BORDER} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
        <input aria-label="Description" placeholder="Description (optional)" className={`${FIELD} sm:col-span-2`} style={BORDER} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button className={BTN_RED} style={{ background: "#E02020" }} disabled={pending}
          onClick={() => run(() => createCohort(f.name, f.year, f.desc), (r) => r.id && router.push(`/admin/cohorts?c=${r.id}`))}>
          Create cohort
        </button>
        <Status msg={msg} />
      </div>
    </details>
  );
}

export function EditCohortForm({ cohort }: { cohort: { id: string; name: string; year: string; desc: string } }) {
  const { pending, msg, run } = useAction();
  const [f, setF] = useState({ name: cohort.name, year: cohort.year, desc: cohort.desc });
  return (
    <div className="grid gap-3 max-w-lg">
      <label className="text-xs font-semibold" style={{ color: "#6b7280" }}>Name
        <input className={`${FIELD} mt-1.5`} style={BORDER} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="text-xs font-semibold" style={{ color: "#6b7280" }}>Academic year
        <input className={`${FIELD} mt-1.5`} style={BORDER} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></label>
      <label className="text-xs font-semibold" style={{ color: "#6b7280" }}>Description
        <input className={`${FIELD} mt-1.5`} style={BORDER} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></label>
      <div className="flex items-center gap-3">
        <button className={BTN_RED} style={{ background: "#E02020" }} disabled={pending}
          onClick={() => run(() => updateCohort(cohort.id, f.name, f.year, f.desc))}>Save changes</button>
        <Status msg={msg} />
      </div>
    </div>
  );
}

export function AddMembersForm({ cohortId }: { cohortId: string }) {
  const { pending, msg, run } = useAction();
  const [text, setText] = useState("");
  return (
    <div className="mb-4">
      <textarea aria-label="Emails to add" rows={2} className={FIELD} style={BORDER} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Paste one or more emails (separated by spaces, commas or new lines). People need an account first." />
      <div className="flex items-center gap-3 mt-2">
        <button className={BTN} style={BORDER} disabled={pending || !text.trim()}
          onClick={() => run(() => addMembersByEmail(cohortId, text), () => setText(""))}>Add to cohort</button>
        <Status msg={msg} />
      </div>
    </div>
  );
}

export function RemoveMemberButton({ userId, cohortId, name }: { userId: string; cohortId: string; name: string }) {
  const { pending, run } = useAction();
  return (
    <button className="text-xs font-semibold disabled:opacity-50" style={{ color: "#E02020" }} disabled={pending}
      onClick={() => { if (confirm(`Remove ${name} from this cohort? Their grades are kept.`)) run(() => setMembership(userId, cohortId, false)); }}>
      Remove
    </button>
  );
}

//  Courses & Lessons 
export function LessonRow({
  lesson, lecturers, isFirst, isLast,
}: {
  lesson: { id: string; order: number; title: string; lecturerId: string; lecturerName: string | null; content: string; impact: string[] };
  lecturers: { id: string; name: string }[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const { pending, msg, run } = useAction();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [deleting, setDeleting] = useState(false);
  const [typed, setTyped] = useState("");

  return (
    <div className="py-3" style={{ borderTop: "0.5px solid #e5e7eb" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#f9fafb", ...BORDER, color: "#6b7280" }}>
          {lesson.order}
        </span>
        <div className="flex-1 min-w-48">
          {editing ? (
            <div className="flex gap-2">
              <input aria-label="Lesson title" className={FIELD} style={BORDER} value={title} onChange={(e) => setTitle(e.target.value)} />
              <button className={BTN} style={BORDER} disabled={pending} onClick={() => run(() => renameLesson(lesson.id, title), () => setEditing(false))}>Save</button>
            </div>
          ) : (
            <p className="text-[15px] font-semibold text-gray-900">{lesson.title}</p>
          )}
          <p className="text-xs mt-0.5" style={{ color: lesson.lecturerName ? "#6b7280" : "#b45309" }}>
            {lesson.lecturerName ? `By ${lesson.lecturerName}` : "No lecturer recorded"} · {lesson.content}
          </p>
        </div>
        <button aria-label="Move up" className={BTN} style={BORDER} disabled={pending || isFirst} onClick={() => run(() => moveLesson(lesson.id, "up"))}>↑</button>
        <button aria-label="Move down" className={BTN} style={BORDER} disabled={pending || isLast} onClick={() => run(() => moveLesson(lesson.id, "down"))}>↓</button>
        <button className={BTN} style={BORDER} onClick={() => setEditing((v) => !v)}>Rename</button>
        <select aria-label={`Lecturer for ${lesson.title}`} className="rounded-lg px-2 py-2 text-xs bg-white" style={BORDER}
          value={lesson.lecturerId} disabled={pending} onChange={(e) => run(() => setLessonLecturer(lesson.id, e.target.value))}>
          <option value="">No lecturer</option>
          {lecturers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <button className={BTN} style={{ border: "0.5px solid #E02020", color: "#E02020" }} onClick={() => setDeleting((v) => !v)}>Delete</button>
      </div>

      {deleting && (
        <div className="mt-3 rounded-lg p-4 text-sm" style={{ background: "#fef2f2", border: "0.5px solid #fecaca" }}>
          <p className="font-semibold text-gray-900">Delete &ldquo;{lesson.title}&rdquo;? This cannot be undone.</p>
          <p className="mt-1 text-gray-700">
            {lesson.impact.length ? `This permanently removes: ${lesson.impact.join(", ")}.` : "This lesson has no content yet."}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <input aria-label="Type the lesson title to confirm" placeholder={lesson.title} className={`${FIELD} sm:max-w-xs`} style={BORDER}
              value={typed} onChange={(e) => setTyped(e.target.value)} />
            <button className={BTN_RED} style={{ background: "#E02020" }} disabled={pending || typed.trim() !== lesson.title}
              onClick={() => run(() => deleteLesson(lesson.id, typed))}>Delete lesson</button>
            <button className={BTN} style={BORDER} onClick={() => { setDeleting(false); setTyped(""); }}>Cancel</button>
          </div>
        </div>
      )}
      <div className="mt-2"><Status msg={msg} /></div>
    </div>
  );
}
