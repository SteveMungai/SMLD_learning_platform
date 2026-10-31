import { redirect } from "next/navigation";

// The study notes, videos and assignments now live under each lesson on the Lessons page.
// This stays only so old bookmarks and links keep working.
export default function NotesPage() {
  redirect("/lessons");
}
