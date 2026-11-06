"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createCourse } from "@/app/lessons/actions";
import { colors } from "./shared";

// Staff only: adds a course to a cohort. A cohort needs at least one course before lessons can be added.
export function AddCourseForm({ cohortId, startOpen = false }: { cohortId: string; startOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await createCourse({ cohortId, title });
    setBusy(false);
    if (res.error) return setError(res.error);
    setTitle("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold min-h-11" style={{ color: colors.red }}>
        <Plus size={15} /> Add course
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        autoFocus={!startOpen}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Course title, e.g. Foundations of Discipleship"
        aria-label="Course title"
        maxLength={120}
        className="flex-1 min-w-[220px] rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20"
        style={{ border: `0.5px solid ${colors.border}`, color: "#111111" }}
      />
      <button type="submit" disabled={busy} className="rounded-lg px-4 min-h-11 text-sm font-semibold text-white disabled:opacity-60" style={{ background: colors.black }}>
        {busy ? "Adding…" : "Add course"}
      </button>
      {!startOpen && <button type="button" onClick={() => { setOpen(false); setError(null); }} className="text-sm text-gray-500 min-h-11">Cancel</button>}
      {error && <p role="alert" className="basis-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
