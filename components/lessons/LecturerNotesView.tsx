import NotesList from "./NotesList";
import SectionLink from "./SectionLink";
import AddNoteForm from "./AddNoteForm";
import type { NoteItem } from "./shared";

export default function LecturerNotesView({ lessonId, notes }: { lessonId: string; notes: NoteItem[] }) {
  return (
    <>
      <NotesList notes={notes} emptyText="No notes yet — add them below." />
      <AddNoteForm lessonId={lessonId} />
      <SectionLink href={`/questions/${lessonId}`}>Continue to questions</SectionLink>
    </>
  );
}
