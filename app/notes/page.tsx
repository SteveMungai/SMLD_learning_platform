import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudentWeekCard, type StudentWeekData } from "@/components/notes/StudentWeekCard";
import { NotesHero, colors } from "@/components/notes/shared";

// TODO: once Assignment / Submission models exist in prisma/schema.prisma,
// replace MOCK_ASSIGNMENTS below with a real
// `include: { assignment: { include: { submissions: { where: { userId } } } } }`
// on the week query, and add `dueDate` enforcement in the submit API route
// (not just in the UI — a client can always ignore a disabled button).
const MOCK_ASSIGNMENTS: Record<number, { title: string; description: string; dueDate: string }> = {
  1: {
    title: "Reflection: what does it mean to gather?",
    description: "Write a one-page reflection connecting this week's teaching to your own small group.",
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // already past due, for demo
  },
  2: {
    title: "Journal: walking in the Word",
    description: "Read John 1:1-18 and journal three things that stood out to you.",
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

const MOCK_META: Record<number, { leader?: string; passage?: string }> = {
  1: { leader: "Pastor James", passage: "Hebrews 10:24-25" },
  2: { leader: "Pastor James", passage: "John 1:1-18" },
};

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cohortId: true },
  });

  if (!user?.cohortId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: colors.cream }}>
        <p className="text-gray-600 text-sm">You are not currently assigned to a cohort.</p>
      </div>
    );
  }

  const weeks = await prisma.week.findMany({
    where: { cohortId: user.cohortId },
    orderBy: { weekNumber: "asc" },
    include: { materials: true },
  });

  const weekData: StudentWeekData[] = weeks.map((week) => ({
    id: week.id,
    weekNumber: week.weekNumber,
    topic: week.topic,
    description: week.description,
    leader: MOCK_META[week.weekNumber]?.leader ?? null,
    passage: MOCK_META[week.weekNumber]?.passage ?? null,
    materials: week.materials.map((m) => ({ id: m.id, type: m.type, title: m.title, fileUrl: m.fileUrl })),
    assignment: MOCK_ASSIGNMENTS[week.weekNumber]
      ? { id: `mock-${week.weekNumber}`, ...MOCK_ASSIGNMENTS[week.weekNumber] }
      : null,
    mySubmission: null,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.cream }}>
      <NotesHero
        eyebrow="CITAM — Small Group Study Notes"
        title="This Term's Study Series"
        subtitle="Catch up on this week's notes and teaching video, then submit your assignment before the deadline."
      />
      <div className="max-w-3xl mx-auto px-4">
        <div className="py-6 border-b-2" style={{ borderColor: colors.black }}>
          <p className="text-sm text-gray-500">Tap a week to view notes and assignments</p>
        </div>

        {weekData.length === 0 ? (
          <p className="text-sm text-gray-500 py-8">No weeks have been posted yet.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {weekData.map((week) => (
              <StudentWeekCard key={week.id} week={week} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}