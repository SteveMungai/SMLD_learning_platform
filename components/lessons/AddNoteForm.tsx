"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addNote, updateNote } from "@/app/lessons/actions";
import { colors, inputClass, inputStyle } from "./shared";
import RichTextEditor from "./RichTextEditor";

type EditingNote = { id: string; title: string; html: string; fileLink: string };

export default function AddNoteForm({ lessonId, note, onDone }: { lessonId: string; note?: EditingNote; onDone?: () => void }) {
  const router = useRouter();
  const draftKey = `note-draft:${lessonId}`;
  const [title, setTitle] = useState(note?.title ?? "");
  const [html, setHtml] = useState(note?.html ?? "");
  const [url, setUrl] = useState(note?.fileLink ?? "");
  const [editorKey, setEditorKey] = useState(0); // new key = editor reloads with `startHtml`
  const [startHtml, setStartHtml] = useState(note?.html ?? "");
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = useRef(false);

  // Bring back an unfinished draft (new notes only).
  useEffect(() => {
    if (note) return void (ready.current = true);
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) ?? "null") as { title?: string; html?: string; url?: string } | null;
      if (saved && (saved.title || saved.html || saved.url)) {
        /* eslint-disable react-hooks/set-state-in-effect -- browser storage can only be read after the page has loaded */
        setTitle(saved.title ?? ""); setHtml(saved.html ?? ""); setUrl(saved.url ?? "");
        setStartHtml(saved.html ?? ""); setEditorKey((k) => k + 1); setRestored(true);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch { /* storage unavailable or damaged: start empty */ }
    ready.current = true;
  }, [draftKey, note]);

  // Keep the draft up to date a moment after each change.
  useEffect(() => {
    if (note || !ready.current) return;
    const t = setTimeout(() => {
      try {
        if (title || html || url) localStorage.setItem(draftKey, JSON.stringify({ title, html, url }));
        else localStorage.removeItem(draftKey);
      } catch { /* ignore */ }
    }, 1200);
    return () => clearTimeout(t);
  }, [title, html, url, draftKey, note]);

  const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = note ? await updateNote(note.id, { title, content: html, url }) : await addNote(lessonId, { title, content: html, url });
    setBusy(false);
    if (res.error) return setError(res.error);
    if (note) {
      onDone?.();
    } else {
      clearDraft();
      setTitle(""); setHtml(""); setUrl(""); setStartHtml(""); setRestored(false); setEditorKey((k) => k + 1);
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className={`${note ? "" : "mt-10"} rounded-lg p-4 sm:p-5 space-y-3 text-left`} style={{ background: colors.panel, border: `0.5px solid ${colors.border}` }}>
      <h2 className="text-sm font-bold text-gray-900">{note ? "Edit notes" : "Add notes"}</h2>
      {restored && (
        <p className="text-xs flex flex-wrap items-center gap-2" style={{ color: colors.muted }} role="status">
          We restored your unfinished draft.
          <button type="button" className="font-semibold underline" onClick={() => { clearDraft(); setTitle(""); setHtml(""); setUrl(""); setStartHtml(""); setEditorKey((k) => k + 1); setRestored(false); }}>Discard it</button>
        </p>
      )}
      <input placeholder="Title, e.g. What is Discipleship?" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle} aria-label="Notes title" />
      <RichTextEditor key={editorKey} initialHtml={startHtml} onChange={setHtml} />
      <input placeholder="Link to a downloadable file (optional)" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} style={inputStyle} aria-label="File link" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="rounded-lg px-4 min-h-11 text-sm font-semibold text-white disabled:opacity-60" style={{ background: colors.black }}>
          {busy ? "Saving…" : note ? "Save changes" : "Add notes"}
        </button>
        {note && (
          <button type="button" onClick={onDone} className="rounded-lg px-4 min-h-11 text-sm font-semibold text-gray-900 bg-white" style={{ border: `0.5px solid ${colors.border}` }}>Cancel</button>
        )}
      </div>
    </form>
  );
}
