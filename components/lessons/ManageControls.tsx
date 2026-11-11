"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCourse, deleteLesson, renameCourse, renameLesson } from "@/app/lessons/actions";
import { colors } from "./shared";

const FIELD = "flex-1 min-w-[200px] rounded-lg px-3 py-2.5 text-base sm:text-sm bg-white text-gray-900";

/**
 * Rename and delete for a course or a lesson (lecturers in their own cohorts, and admins).
 * Delete lists what will be lost and needs the title typed back, so it can't be done by accident.
 */
export function ManageControls({ kind, id, title, impact }: { kind: "course" | "lesson"; id: string; title: string; impact: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "rename" | "delete">(null);
  const [name, setName] = useState(title);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => { setMode(null); setError(null); setTyped(""); setName(title); };

  async function run(fn: () => Promise<{ error: string | null }>) {
    setBusy(true);
    setError(null);
    const r = await fn();
    setBusy(false);
    if (r.error) return setError(r.error);
    setMode(null);
    setTyped("");
    router.refresh();
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap gap-x-4">
        <button type="button" className="text-xs font-semibold min-h-9" style={{ color: colors.black }} onClick={() => { setMode(mode === "rename" ? null : "rename"); setError(null); }}>Rename</button>
        <button type="button" className="text-xs font-semibold min-h-9" style={{ color: "#C81E1E" }} onClick={() => { setMode(mode === "delete" ? null : "delete"); setError(null); }}>Delete</button>
      </div>

      {mode === "rename" && (
        <form
          className="flex flex-wrap items-center gap-2 mt-1"
          onSubmit={(e) => { e.preventDefault(); run(() => (kind === "course" ? renameCourse(id, name) : renameLesson(id, name))); }}
        >
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label={`New ${kind} title`} maxLength={150} className={FIELD} style={{ border: `0.5px solid ${colors.border}` }} />
          <button type="submit" disabled={busy || !name.trim() || name.trim() === title} className="rounded-lg px-4 min-h-10 text-xs font-semibold text-white disabled:opacity-50" style={{ background: colors.black }}>{busy ? "Saving…" : "Save"}</button>
          <button type="button" onClick={close} className="text-xs text-gray-500 min-h-10">Cancel</button>
        </form>
      )}

      {mode === "delete" && (
        <div className="mt-2 rounded-lg p-3 sm:p-4" style={{ background: "#fef2f2", border: "0.5px solid #fecaca" }}>
          <p className="font-semibold text-gray-900">Delete &ldquo;{title}&rdquo;? This cannot be undone.</p>
          <p className="mt-1 text-gray-700">{impact}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={title} aria-label={`Type the ${kind} title to confirm`} className={FIELD} style={{ border: `0.5px solid ${colors.border}` }} />
            <button type="button" disabled={busy || typed.trim() !== title} onClick={() => run(() => (kind === "course" ? deleteCourse(id, typed) : deleteLesson(id, typed)))} className="rounded-lg px-4 min-h-10 text-xs font-semibold text-white disabled:opacity-50" style={{ background: "#C81E1E" }}>{busy ? "Deleting…" : `Delete ${kind}`}</button>
            <button type="button" onClick={close} className="text-xs text-gray-600 min-h-10">Cancel</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
