import { redirect } from "next/navigation";

// The instructor dashboard moved onto the Lessons page (each lesson expands to show
// materials, the assignment and submissions). Kept so old links keep working.
export default function InstructorNotesPage() {
  redirect("/lessons");
}
