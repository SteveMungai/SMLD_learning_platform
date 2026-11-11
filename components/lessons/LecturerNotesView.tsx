import NotesList from "./NotesList";
import SectionLink from "./SectionLink";
import AddNoteForm from "./AddNoteForm";
import type { NoteItem } from "./shared";

export default function LecturerNotesView({ lessonId, notes, viewerLabel }: { lessonId: string; notes: NoteItem[]; viewerLabel: string }) {
  return (
    <>
      <NotesList notes={notes} emptyText="No notes yet — add them below." lessonId={lessonId} canManage viewerLabel={viewerLabel} />
      <AddNoteForm lessonId={lessonId} />
      <SectionLink href={`/questions/${lessonId}`}>Continue to questions</SectionLink>
    </>
  );
}
