import NotesList from "./NotesList";
import SectionLink from "./SectionLink";
import { colors, type NoteItem } from "./shared";

export type AssignmentStatus = {
  title: string;
  dueText: string;
  pastDue: boolean;
  acceptLate: boolean;
  progress: "none" | "draft" | "submitted" | "graded";
  submittedLate: boolean;
  grade: { total: number | null; max: number | null } | null;
} | null;

function statusText(a: NonNullable<AssignmentStatus>) {
  if (a.progress === "graded") return `Graded: ${a.grade?.total ?? 0}${a.grade?.max != null ? ` / ${a.grade.max}` : ""}`;
  if (a.progress === "submitted") return a.submittedLate ? "Submitted late — awaiting grade" : "Submitted — awaiting grade";
  if (a.progress === "draft") return "Draft saved — not submitted yet";
  if (a.pastDue) return a.acceptLate ? "Past due — late work is still accepted" : "Past due — submissions closed";
  return "Not submitted yet";
}

export default function StudentNotesView({ lessonId, notes, assignment }: { lessonId: string; notes: NoteItem[]; assignment: AssignmentStatus }) {
  return (
    <>
      <NotesList notes={notes} emptyText="Your lecturer hasn’t added notes for this lesson yet." />

      {assignment && (
        <section className="mt-10 rounded-lg p-4 text-left" style={{ background: colors.panel, border: `0.5px solid ${colors.border}` }}>
          <h2 className="text-sm font-bold text-gray-900">{assignment.title}</h2>
          <p className="text-xs mt-0.5" style={{ color: colors.muted }}>Due {assignment.dueText}</p>
          <p className="text-sm font-semibold mt-2" style={{ color: assignment.progress === "graded" || assignment.progress === "submitted" ? colors.success : "#111111" }}>
            {statusText(assignment)}
          </p>
        </section>
      )}

      <SectionLink href={`/questions/${lessonId}`}>Continue to questions</SectionLink>
    </>
  );
}
