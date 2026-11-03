import { isHtmlNote } from "@/lib/notes-shared";
import { sanitizeNoteHtml } from "@/lib/notes";

/**
 * A note's written content. Formatted notes are HTML from the editor, cleaned again here before
 * display. Older notes are plain text and are shown as typed, with line breaks kept.
 */
export default function NoteContent({ content }: { content: string }) {
  if (!isHtmlNote(content)) {
    return <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap break-words">{content}</p>;
  }
  return <div className="note-content" dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(content) }} />;
}
