import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WeekSection } from "./weekSection";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cohortId: true },
  });

  if (!user?.cohortId) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <p>You are not currently assigned to a cohort.</p>
      </div>
    );
  }

  const weeks = await prisma.week.findMany({
    where: { cohortId: user.cohortId },
    orderBy: { weekNumber: "asc" },
    include: { materials: true },
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Class Notes</h1>
      {weeks.length === 0 ? (
        <p>No weeks have been posted yet.</p>
      ) : (
        weeks.map((week: (typeof weeks)[number]) => (
          <WeekSection key={week.id} week={week} />
        ))
      )}
    </div>
  );
}