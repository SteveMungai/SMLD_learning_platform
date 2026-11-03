"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteNote } from "@/app/lessons/actions";
import AddNoteForm from "./AddNoteForm";
import { colors } from "./shared";

/** Shows a note with Edit and Delete for lecturers; Edit swaps the note for the editor. */
export default function EditableNote({
  lessonId, note, children,
}: {
  lessonId: string;
  note: { id: string; title: string; html: string; fileLink: string };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) return <AddNoteForm lessonId={lessonId} note={note} onDone={() => setEditing(false)} />;

  return (
    <div>
      {children}
      <div className="flex flex-wrap items-center gap-4 mt-3">
        <button type="button" className="text-xs font-semibold min-h-9" style={{ color: colors.black }} onClick={() => setEditing(true)}>Edit</button>
        <button
          type="button"
          disabled={busy}
          className="text-xs font-semibold min-h-9 disabled:opacity-50"
          style={{ color: "#C81E1E" }}
          onClick={async () => {
            if (!confirm(`Delete the notes "${note.title}"? Students will no longer see them.`)) return;
            setBusy(true);
            const res = await deleteNote(note.id);
            setBusy(false);
            if (res.error) return setError(res.error);
            router.refresh();
          }}
        >
          Delete
        </button>
        {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
