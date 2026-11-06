import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lookupJoinCode, normalizeJoinCode } from "@/lib/joinCodes";
import RegisterForm from "@/components/auth/RegisterForm";

// /register?code=K7P2XQ9M is the link an admin shares with a cohort. People who are already signed in
// are sent on to the Join page, because they don't need a new account.
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: raw } = await searchParams;
  const code = normalizeJoinCode(raw ?? "");
  const session = await getServerSession(authOptions);
  if (session?.user?.id) redirect(code ? `/join?code=${code}` : "/lessons");

  let cohortName: string | null = null;
  let codeProblem = false;
  if (code) {
    const found = await lookupJoinCode(code);
    if (found.ok) cohortName = found.cohort.CohortName;
    else codeProblem = true;
  }
  return <RegisterForm initialCode={code} cohortName={cohortName} codeProblem={codeProblem} />;
}
