import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NotesView } from "./NotesView";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cohortId: true },
  });

  const weeks = user?.cohortId
    ? await prisma.week.findMany({
        where: { cohortId: user.cohortId },
        orderBy: { weekNumber: "asc" },
        include: { materials: true },
      })
    : [];

  return (
    <div className="min-h-full" style={{ background: "var(--ink)" }}>
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <header className="mb-10">
          <p
            className="mb-2 text-xs font-medium tracking-[0.2em] uppercase"
            style={{ color: "var(--gold-dim)" }}
          >
            SMLD
          </p>
          <h1
            className="font-serif text-3xl sm:text-4xl"
            style={{ color: "var(--paper)" }}
          >
            Class Notes
          </h1>
        </header>

        {!user?.cohortId ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            You&apos;re not currently assigned to a cohort. Contact an
            administrator to be enrolled.
          </p>
        ) : weeks.length === 0 ? (
          <p className="text-sm italic" style={{ color: "var(--muted)" }}>
            Nothing has been posted for your cohort yet — check back after
            your next session.
          </p>
        ) : (
          <NotesView weeks={weeks} />
        )}
      </div>
    </div>
  );
}