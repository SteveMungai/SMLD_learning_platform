import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudentWeekCard, type StudentWeekData } from "@/components/notes/StudentWeekCard";
import { NotesHero, colors } from "@/components/notes/shared";

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
    include: {
      materials: true,
      assignments: {
        include: {
          submissions: { where: { studentId: session.user.id } },
        },
      },
    },
  });

  const weekData: StudentWeekData[] = weeks.map((week) => {
    const assignment = week.assignments[0] ?? null;
    const mySubmission = assignment?.submissions[0] ?? null;

    return {
      id: week.id,
      weekNumber: week.weekNumber,
      topic: week.topic,
      description: week.description,
      leader: MOCK_META[week.weekNumber]?.leader ?? null,
      passage: MOCK_META[week.weekNumber]?.passage ?? null,
      materials: week.materials.map((m) => ({ id: m.id, type: m.type, title: m.title, fileUrl: m.fileUrl })),
      assignment: assignment
        ? {
            id: assignment.id,
            title: assignment.title,
            description: assignment.instructions ?? "",
            dueDate: assignment.dueDate.toISOString(),
          }
        : null,
      mySubmission: mySubmission
        ? {
            id: mySubmission.id,
            status: mySubmission.status,
            submittedAt: mySubmission.submittedAt.toISOString(),
            grade: mySubmission.grade,
            feedback: mySubmission.feedback,
          }
        : null,
    };
  });

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