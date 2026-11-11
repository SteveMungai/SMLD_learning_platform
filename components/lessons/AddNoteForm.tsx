"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { addNote, updateNote } from "@/app/lessons/actions";
import { checkNoteFile, NOTE_FILE_ACCEPT, NOTE_FILE_HELP } from "@/lib/noteFiles";
import { colors, inputClass, inputStyle } from "./shared";
import RichTextEditor from "./RichTextEditor";

type EditingNote = { id: string; title: string; html: string; file: { name: string; sizeKB: number } | null; legacyLink: boolean };

/**
 * Add notes to a lesson, or (with `note`) edit one that already exists.
 * Written notes are kept as a draft in this browser while they are being written, so a refresh,
 * a lost connection or a closed tab does not lose the work. (A chosen PDF is not kept; pick it again.)
 */
export default function AddNoteForm({ lessonId, note, onDone }: { lessonId: string; note?: EditingNote; onDone?: () => void }) {
  const router = useRouter();
  const draftKey = `note-draft:${lessonId}`;
  const [title, setTitle] = useState(note?.title ?? "");
  const [html, setHtml] = useState(note?.html ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // new key = editor reloads with `startHtml`
  const [startHtml, setStartHtml] = useState(note?.html ?? "");
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const ready = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const keepsExisting = !!note?.file && !removeFile;
  const hasFile = !!file || keepsExisting;

  // Bring back an unfinished draft (new notes only).
  useEffect(() => {
    if (note) return void (ready.current = true);
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) ?? "null") as { title?: string; html?: string } | null;
      if (saved && (saved.title || saved.html)) {
        /* eslint-disable react-hooks/set-state-in-effect -- browser storage can only be read after the page has loaded */
        setTitle(saved.title ?? ""); setHtml(saved.html ?? "");
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
        if (title || html) localStorage.setItem(draftKey, JSON.stringify({ title, html }));
        else localStorage.removeItem(draftKey);
      } catch { /* ignore */ }
    }, 1200);
    return () => clearTimeout(t);
  }, [title, html, draftKey, note]);

  const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } };
  const resetFile = () => { setFile(null); setFileError(null); if (fileInput.current) fileInput.current.value = ""; };

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    if (!chosen) return resetFile();
    const problem = checkNoteFile(chosen);
    if (problem) { setFileError(problem); setFile(null); e.target.value = ""; return; }
    setFileError(null);
    setFile(chosen);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = note ? await updateNote(note.id, { title, content: html, hasFile }) : await addNote(lessonId, { title, content: html, hasFile });
    if (res.error || !res.id) { setBusy(false); return setError(res.error ?? "Something went wrong. Please try again."); }

    // The PDF goes up separately from the text, to its own endpoint.
    let fileProblem: string | null = null;
    try {
      if (note && removeFile && !file) await fetch(`/api/notes/${res.id}/file`, { method: "DELETE" });
      if (file) {
        const body = new FormData();
        body.append("file", file);
        const up = await fetch(`/api/notes/${res.id}/file`, { method: "POST", body });
        if (!up.ok) fileProblem = ((await up.json().catch(() => null)) as { error?: string } | null)?.error ?? "The PDF didn't upload.";
      }
    } catch {
      fileProblem = "The PDF didn't upload. Check your connection.";
    }
    setBusy(false);

    if (!note) {
      clearDraft();
      setTitle(""); setHtml(""); setStartHtml(""); setRestored(false); setEditorKey((k) => k + 1); resetFile();
    }
    router.refresh();
    if (fileProblem) return setError(`Your notes were saved, but the PDF didn't upload: ${fileProblem} Open Edit on the note to try again.`);
    if (note) onDone?.();
  }

  return (
    <form onSubmit={submit} className={`${note ? "" : "mt-10"} rounded-lg p-4 sm:p-5 space-y-3 text-left`} style={{ background: colors.panel, border: `0.5px solid ${colors.border}` }}>
      <h2 className="text-sm font-bold text-gray-900">{note ? "Edit notes" : "Add notes"}</h2>
      {restored && (
        <p className="text-xs flex flex-wrap items-center gap-2" style={{ color: colors.muted }} role="status">
          We restored your unfinished draft.
          <button type="button" className="font-semibold underline" onClick={() => { clearDraft(); setTitle(""); setHtml(""); setStartHtml(""); setEditorKey((k) => k + 1); setRestored(false); }}>Discard it</button>
        </p>
      )}
      <input placeholder="Title, e.g. What is Discipleship?" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle} aria-label="Notes title" />
      <RichTextEditor key={editorKey} initialHtml={startHtml} onChange={setHtml} />

      <div className="rounded-lg p-3 bg-white" style={{ border: `0.5px solid ${colors.border}` }}>
        <label htmlFor={`pdf-${note?.id ?? "new"}`} className="block text-sm font-semibold text-gray-900">Attach a PDF (optional)</label>
        <p className="text-xs mt-0.5 mb-2 inline-flex items-center gap-1.5" style={{ color: colors.muted }}><Lock size={12} aria-hidden="true" /> Students read it on screen. They can&apos;t download it. {NOTE_FILE_HELP}</p>
        {note?.legacyLink && !note.file && <p className="text-xs mb-2" style={{ color: "#92400e" }}>This note has an old file link that students can&apos;t open any more. Attach the document here instead.</p>}
        {keepsExisting && note?.file && (
          <p className="text-sm mb-2 flex flex-wrap items-center gap-2">
            Current document: <b className="break-all">{note.file.name}</b> <span className="text-xs text-gray-500">{note.file.sizeKB} KB</span>
            <button type="button" className="text-xs font-semibold underline" style={{ color: "#C81E1E" }} onClick={() => setRemoveFile(true)}>Remove it</button>
          </p>
        )}
        {removeFile && note?.file && (
          <p className="text-sm mb-2 flex flex-wrap items-center gap-2" role="status">The document will be removed when you save.
            <button type="button" className="text-xs font-semibold underline" onClick={() => setRemoveFile(false)}>Keep it</button></p>
        )}
        <input ref={fileInput} id={`pdf-${note?.id ?? "new"}`} type="file" accept={NOTE_FILE_ACCEPT} onChange={pickFile} className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white" />
        {file && (
          <p className="text-xs mt-2 flex flex-wrap items-center gap-2" style={{ color: colors.muted }}>
            Ready to upload: {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
            <button type="button" className="font-semibold underline" onClick={resetFile}>Clear</button>
          </p>
        )}
        {fileError && <p role="alert" className="text-xs mt-2 text-red-600">{fileError}</p>}
      </div>

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
