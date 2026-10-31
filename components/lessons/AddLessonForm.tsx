"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addLesson } from "@/app/lessons/actions";
import { colors } from "./shared";

// Lecturers only: adds a lesson to the end of a course 
export function AddLessonForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await addLesson({ courseId, title });
    setBusy(false);
    if (res.error) return setError(res.error);
    setTitle("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: colors.red }}>
        <Plus size={15} /> Add lesson
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Lesson title, e.g. Walking in the Word"
        aria-label="Lesson title"
        maxLength={120}
        className="flex-1 min-w-[220px] rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20"
        style={{ border: `0.5px solid ${colors.border}`, color: "#111111" }}
      />
      <button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: colors.black }}>
        {busy ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={() => { setOpen(false); setError(null); }} className="text-sm text-gray-500">Cancel</button>
      {error && <p className="basis-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
