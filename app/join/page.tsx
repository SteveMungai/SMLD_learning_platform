import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { UserCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lookupJoinCode, normalizeJoinCode } from "@/lib/joinCodes";
import StatePage from "@/components/StatePage";
import EmptyState from "@/components/EmptyState";
import JoinForm from "@/components/join/JoinForm";

// For people who already have an account and have been given a code (a new intake, or a second cohort).
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: raw } = await searchParams;
  const code = normalizeJoinCode(raw ?? "");
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) redirect(code ? `/login?callbackUrl=${encodeURIComponent(`/join?code=${code}`)}` : "/login?callbackUrl=%2Fjoin");

  if (user.role !== "STUDENT") {
    return (
      <StatePage heading="Join a cohort">
        <EmptyState icon={UserCheck} title="Lecturers are added by an admin" actions={[{ href: "/lessons", label: "Go to lessons", primary: true }]}>
          A cohort&apos;s join code is for students. An admin adds lecturers to the cohorts they teach.
        </EmptyState>
      </StatePage>
    );
  }

  const [mine, preview] = await Promise.all([
    prisma.cohortMembership.findMany({ where: { UserID: user.id, Status: "ACTIVE" }, select: { cohort: { select: { CohortName: true } } } }),
    code ? lookupJoinCode(code) : null,
  ]);

  return (
    <StatePage heading="Join a cohort">
      <div className="max-w-xl mx-auto space-y-5">
        {mine.length > 0 && (
          <p className="text-sm text-gray-600">You&apos;re currently in: <b>{mine.map((m) => m.cohort.CohortName).join(", ")}</b>. A new code adds you to another cohort.</p>
        )}
        <JoinForm initialCode={code} previewName={preview && preview.ok ? preview.cohort.CohortName : null} />
        {code && preview && !preview.ok && (
          <p role="alert" className="text-sm" style={{ color: "#92400e" }}>That link isn&apos;t active any more. Ask your lecturer for a new code.</p>
        )}
      </div>
    </StatePage>
  );
}
