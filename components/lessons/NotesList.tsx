import { Download, FileText } from "lucide-react";
import { colors, type NoteItem } from "./shared";

// The lesson's notes: written content (as typed, line breaks kept) and/or a file to download.
export default function NotesList({ notes, emptyText }: { notes: NoteItem[]; emptyText: string }) {
  if (notes.length === 0) {
    return <p className="text-sm" style={{ color: colors.muted }}>{emptyText}</p>;
  }
  return (
    <div className="space-y-8 text-left">
      {notes.map((n) => (
        <article key={n.id}>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{n.title}</h2>
          {n.content && <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{n.content}</p>}
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
      ))}
    </div>
  );
}
