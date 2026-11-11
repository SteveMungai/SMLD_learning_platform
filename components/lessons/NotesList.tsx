import { AlertTriangle } from "lucide-react";
import { colors, type NoteItem } from "./shared";
import NoteContent from "./NoteContent";
import EditableNote from "./EditableNote";
import SecureDocViewer from "./SecureDocViewer";
import { editorHtml } from "@/lib/notes-shared";
import { formatDay } from "@/lib/noteFiles";
import { sanitizeNoteHtml } from "@/lib/notes";

// The lesson's notes: formatted written content and/or a PDF read in the on-screen viewer (never downloaded).
// Lecturers can edit or delete each one.
export default function NotesList({
  notes, emptyText, lessonId, canManage = false, viewerLabel,
}: {
  notes: NoteItem[];
  emptyText: string;
  lessonId?: string;
  canManage?: boolean;
  viewerLabel: string;
}) {
  if (notes.length === 0) {
    return <p className="text-sm" style={{ color: colors.muted }}>{emptyText}</p>;
  }
  return (
    <div className="space-y-8 text-left">
      {notes.map((n) => {
        const article = (
          <article>
            <h2 className="text-lg font-bold text-gray-900 break-words">{n.title}</h2>
            <p className="text-xs mt-0.5 mb-2" style={{ color: colors.muted }}>Added {formatDay(n.dateUploaded)}</p>
            {n.content && <NoteContent content={n.content} />}
            {n.file && <SecureDocViewer noteId={n.id} fileName={n.file.name} sizeKB={n.file.sizeKB} label={viewerLabel} />}
            {!n.file && n.hasLegacyLink && (
              <p className="mt-3 inline-flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: "#fffbeb", color: "#92400e" }}>
                <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                {canManage ? "This note has an old file link that students can no longer open. Edit it and attach the document as a PDF." : "A document for this note isn't available yet. Your lecturer will add it."}
              </p>
            )}
          </article>
        );
        return canManage && lessonId ? (
          <EditableNote
            key={n.id}
            lessonId={lessonId}
            note={{
              id: n.id,
              title: n.title,
              html: editorHtml(n.content ? (n.content.trimStart().startsWith("<") ? sanitizeNoteHtml(n.content) : n.content) : null),
              file: n.file,
              legacyLink: n.hasLegacyLink,
            }}
          >
            {article}
          </EditableNote>
        ) : (
          <div key={n.id}>{article}</div>
        );
      })}
    </div>
  );
}
