import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardStyle } from "@/lib/admin";
import { AddMembersForm, CreateCohortForm, EditCohortForm, RemoveMemberButton } from "@/components/admin/AdminClient";

type Search = Record<string, string | undefined>;

export default async function AdminCohortsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const cohorts = await prisma.cohort.findMany({
    orderBy: { CohortName: "asc" },
    include: {
      _count: { select: { memberships: { where: { Status: "ACTIVE" } } } },
      courses: { select: { _count: { select: { lessons: true } } } },
    },
  });
  const current = cohorts.find((c) => c.CohortID === sp.c) ?? cohorts[0];
  const tab = sp.tab === "settings" ? "settings" : "members";
  const members = current
    ? await prisma.cohortMembership.findMany({
        where: { CohortID: current.CohortID, Status: "ACTIVE" },
        include: { user: { select: { UserID: true, FullName: true, Email: true } } },
        orderBy: { user: { FullName: "asc" } },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cohorts</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Create cohorts and manage who belongs to them.</p>
      </div>
      <CreateCohortForm />

      {cohorts.length === 0 && <p className="text-sm" style={{ color: "#6b7280" }}>No cohorts yet. Create the first one above.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cohorts.map((c) => {
          const lessons = c.courses.reduce((n, course) => n + course._count.lessons, 0);
          const active = c.CohortID === current?.CohortID;
          return (
            <Link key={c.CohortID} href={`/admin/cohorts?c=${c.CohortID}`} className="rounded-xl p-4 no-underline"
              style={{ border: active ? "1.5px solid #E02020" : "0.5px solid #e5e7eb" }}>
              <p className="text-base font-bold text-gray-900">{c.CohortName}</p>
              <p className="text-xs mt-0.5 mb-2.5" style={{ color: "#6b7280" }}>Academic year {c.AcademicYear}</p>
              <p className="text-[13px] text-gray-700">{c._count.memberships} students · {lessons ? `${lessons} lessons` : "no lessons yet"}</p>
            </Link>
          );
        })}
      </div>

      {current && (
        <section className="rounded-xl p-5" style={cardStyle}>
          <h2 className="text-lg font-bold text-gray-900">{current.CohortName}</h2>
          <div className="flex gap-6 mt-2 mb-4 text-sm font-semibold" style={{ borderBottom: "0.5px solid #e5e7eb" }}>
            {(["members", "settings"] as const).map((t) => (
              <Link key={t} href={`/admin/cohorts?c=${current.CohortID}&tab=${t}`} className="py-2.5 no-underline capitalize"
                style={{ color: tab === t ? "#E02020" : "#6b7280", borderBottom: tab === t ? "2px solid #E02020" : "2px solid transparent" }}>{t}</Link>
            ))}
          </div>

          {tab === "settings" ? (
            <EditCohortForm key={current.CohortID} cohort={{ id: current.CohortID, name: current.CohortName, year: current.AcademicYear, desc: current.Description ?? "" }} />
          ) : (
            <>
              <AddMembersForm cohortId={current.CohortID} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs" style={{ background: "#f9fafb", color: "#6b7280" }}>
                    <th className="px-4 py-2.5 font-semibold">Member</th><th className="px-4 py-2.5 font-semibold">Joined</th><th className="px-4 py-2.5" />
                  </tr></thead>
                  <tbody>
                    {members.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center" style={{ color: "#6b7280" }}>No members yet. Paste emails above to add people.</td></tr>}
                    {members.map((m) => (
                      <tr key={m.MembershipID} style={{ borderTop: "0.5px solid #e5e7eb" }}>
                        <td className="px-4 py-3 font-semibold">{m.user.FullName ?? "(no name)"}<br /><span className="text-xs font-normal" style={{ color: "#6b7280" }}>{m.user.Email}</span></td>
                        <td className="px-4 py-3" style={{ color: "#6b7280" }}>{m.DateJoined.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium" })}</td>
                        <td className="px-4 py-3 text-right"><RemoveMemberButton userId={m.user.UserID} cohortId={current.CohortID} name={m.user.FullName ?? m.user.Email} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs mt-3" style={{ color: "#6b7280" }}>Removing someone keeps their grades. They just lose access to this cohort&apos;s lessons.</p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
