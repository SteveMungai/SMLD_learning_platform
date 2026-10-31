"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addVideo } from "@/app/lessons/actions";
import { colors, inputClass, inputStyle } from "./shared";

export default function AddVideoForm({ lessonId, hasVideo }: { lessonId: string; hasVideo: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return setError("Add a title and a YouTube link.");
    setBusy(true);
    setError(null);
    const res = await addVideo(lessonId, title, url);
    setBusy(false);
    if (res.error) return setError(res.error);
    setTitle("");
    setUrl("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto mt-8 rounded-lg p-5 space-y-3 text-left" style={{ background: colors.panel, border: `0.5px solid ${colors.border}` }}>
      <h2 className="text-sm font-bold text-gray-900">{hasVideo ? "Replace the video" : "Add a video"}</h2>
      <p className="text-xs text-gray-500">Each lesson has one teaching video{hasVideo ? "; adding a new one replaces the current video" : ""}.</p>
      <input placeholder="Title, e.g. Lesson 3 teaching" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle} aria-label="Video title" />
      <input placeholder="YouTube link" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} style={inputStyle} aria-label="YouTube link" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: colors.black }}>
        {busy ? "Saving…" : hasVideo ? "Replace video" : "Add video"}
      </button>
    </form>
  );
}
