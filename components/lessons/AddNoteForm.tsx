"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addNote } from "@/app/lessons/actions";
import { colors, inputClass, inputStyle } from "./shared";

export default function AddNoteForm({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await addNote(lessonId, { title, content, url });
    setBusy(false);
    if (res.error) return setError(res.error);
    setTitle("");
    setContent("");
    setUrl("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-10 rounded-lg p-5 space-y-3" style={{ background: colors.panel, border: `0.5px solid ${colors.border}` }}>
      <h2 className="text-sm font-bold text-gray-900">Add notes</h2>
      <input placeholder="Title, e.g. What is Discipleship?" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle} aria-label="Notes title" />
      <textarea
        placeholder="Write the notes here (optional if you add a file link). Line breaks are kept."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className={inputClass}
        style={inputStyle}
        aria-label="Notes text"
      />
      <input placeholder="Link to a downloadable file (optional)" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} style={inputStyle} aria-label="File link" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: colors.black }}>
        {busy ? "Adding…" : "Add notes"}
      </button>
    </form>
  );
}
