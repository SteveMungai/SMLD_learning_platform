import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InstructorWeekList } from "@/components/notes/InstructorWeekList";
import { NotesHero, colors } from "@/components/notes/shared";
import type { InstructorWeekData } from "@/components/notes/InstructorWeekCard";

// Demo data — replace with a real query once Assignment / Submission models
// exist in prisma/schema.prisma. Materials already map onto your existing
// Material model; Assignment/Submission would need new models plus API
// routes for: POST /assignments, POST /submissions (reject if past dueDate),
// GET /assignments/:id/submissions.
const MOCK_WEEKS: InstructorWeekData[] = [
  {
    id: "week-1",
    weekNumber: 1,
    topic: "Foundations — why we gather",
    leader: "Pastor James",
    passage: "Hebrews 10:24-25",
    materials: [
      { id: "m1", type: "VIDEO", title: "Week 1 teaching: why we gather", fileUrl: "#" },
      { id: "m2", type: "NOTES", title: "Week 1 study notes", fileUrl: "#" },
    ],
    assignment: {
      id: "a1",
      title: "Reflection: what does it mean to gather?",
      description: "Write a one-page reflection connecting this week's teaching to your own small group.",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    submissions: [
      { id: "s1", studentName: "Amina Wanjiru", submittedAt: new Date().toISOString() },
      { id: "s2", studentName: "Brian Otieno", submittedAt: null },
      { id: "s3", studentName: "Faith Njeri", submittedAt: new Date().toISOString() },
    ],
  },
  {
    id: "week-2",
    weekNumber: 2,
    topic: "Walking in the Word",
    leader: "Pastor James",
    passage: "John 1:1-18",
    materials: [{ id: "m3", type: "NOTES", title: "Week 2 study notes", fileUrl: "#" }],
    assignment: {
      id: "a2",
      title: "Journal: walking in the Word",
      description: "Read John 1:1-18 and journal three things that stood out to you.",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    submissions: [
      { id: "s1", studentName: "Amina Wanjiru", submittedAt: null },
      { id: "s2", studentName: "Brian Otieno", submittedAt: null },
      { id: "s3", studentName: "Faith Njeri", submittedAt: null },
    ],
  },
];

export default async function InstructorNotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "STUDENT") redirect("/notes");

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.cream }}>
      <NotesHero
        eyebrow="CITAM — Instructor Dashboard"
        title="This Term's Study Series"
        subtitle="Add weekly notes and videos, post assignments with a due date, and see who's submitted."
      />
      <div className="max-w-3xl mx-auto px-4">
        <InstructorWeekList initialWeeks={MOCK_WEEKS} />
      </div>
    </div>
  );
}