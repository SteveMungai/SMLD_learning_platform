import { Download, FileText } from "lucide-react";
import { colors, type NoteItem } from "./shared";
import NoteContent from "./NoteContent";
import EditableNote from "./EditableNote";
import { editorHtml } from "@/lib/notes-shared";
import { sanitizeNoteHtml } from "@/lib/notes";

// The lesson's notes: formatted written content and/or a file to download. Lecturers can edit or delete each one.
export default function NotesList({ notes, emptyText, lessonId, canManage = false }: { notes: NoteItem[]; emptyText: string; lessonId?: string; canManage?: boolean }) {
  if (notes.length === 0) {
    return <p className="text-sm" style={{ color: colors.muted }}>{emptyText}</p>;
  }
  return (
    <div className="space-y-8 text-left">
      {notes.map((n) => {
        const article = (
          <article>
            <h2 className="text-lg font-bold text-gray-900 mb-2 break-words">{n.title}</h2>
            {n.content && <NoteContent content={n.content} />}
            {n.hasFile && (
              <a
                href={`/api/materials/${n.id}/download`}
                className="inline-flex items-center gap-2.5 mt-3 rounded-lg px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                style={{ border: `0.5px solid ${colors.border}` }}
              >
                <FileText size={16} className="text-gray-500" />
                Download file
                <Download size={15} className="text-gray-400" />
              </a>
            )}
          </article>
        );
        return canManage && lessonId ? (
          <EditableNote
            key={n.id}
            lessonId={lessonId}
            note={{ id: n.id, title: n.title, html: editorHtml(n.content ? (n.content.trimStart().startsWith("<") ? sanitizeNoteHtml(n.content) : n.content) : null), fileLink: n.fileLink ?? "" }}
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
