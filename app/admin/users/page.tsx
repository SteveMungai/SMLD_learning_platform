import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidFullName } from "@/lib/names";
import { cardStyle, ROLE_LABEL } from "@/lib/admin";
import { UserPanel } from "@/components/admin/AdminClient";

type Search = Record<string, string | undefined>;
const ROLE_CHIP: Record<Role, { bg: string; fg: string }> = {
  STUDENT: { bg: "#f3f4f6", fg: "#374151" },
  INSTRUCTOR: { bg: "rgba(224,32,32,0.1)", fg: "#b91c1c" },
  ADMIN: { bg: "#111", fg: "#fff" },
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const session = await getServerSession(authOptions);

  const where: Prisma.UserWhereInput = {};
  if (sp.q) where.OR = [{ FullName: { contains: sp.q, mode: "insensitive" } }, { Email: { contains: sp.q, mode: "insensitive" } }];
  if (sp.role === "STUDENT" || sp.role === "INSTRUCTOR" || sp.role === "ADMIN") where.Role = sp.role;
  if (sp.cohort) where.cohortMemberships = { some: { CohortID: sp.cohort, Status: "ACTIVE" } };
  if (sp.filter === "nocohort") {
    where.Role = "STUDENT";
    where.cohortMemberships = { none: { Status: "ACTIVE" } };
  }

  const [found, cohorts, selected] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ FullName: "asc" }, { Email: "asc" }],
      take: 300,
      select: { UserID: true, FullName: true, Email: true, Role: true, cohortMemberships: { where: { Status: "ACTIVE" }, select: { cohort: { select: { CohortName: true } } } } },
    }),
    prisma.cohort.findMany({ orderBy: { CohortName: "asc" }, select: { CohortID: true, CohortName: true } }),
    sp.u
      ? prisma.user.findUnique({
          where: { UserID: sp.u },
          include: { cohortMemberships: { where: { Status: "ACTIVE" }, include: { cohort: { select: { CohortID: true, CohortName: true } } } } },
        })
      : null,
  ]);
  const users = sp.filter === "badname" ? found.filter((u) => !isValidFullName(u.FullName)) : found;

  const link = (id: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "u") p.set(k, v);
    p.set("u", id);
    return `/admin/users?${p.toString()}`;
  };
  const field = "rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900";

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
      <p className="text-sm mt-1 mb-5" style={{ color: "#6b7280" }}>Search people, change roles and manage cohorts.</p>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex-1 min-w-0">
          <form className="flex flex-wrap gap-2 mb-4" action="/admin/users">
            {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
            <input name="q" defaultValue={sp.q} aria-label="Search users" placeholder="Search name or email" className={`${field} flex-1 min-w-48`} style={cardStyle} />
            <select name="role" defaultValue={sp.role ?? ""} aria-label="Role" className={field} style={cardStyle}>
              <option value="">All roles</option>
              {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select name="cohort" defaultValue={sp.cohort ?? ""} aria-label="Cohort" className={field} style={cardStyle}>
              <option value="">All cohorts</option>
              {cohorts.map((c) => <option key={c.CohortID} value={c.CohortID}>{c.CohortName}</option>)}
            </select>
            <button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#E02020" }}>Search</button>
          </form>
          {sp.filter && (
            <p className="text-sm mb-3" style={{ color: "#6b7280" }}>
              Showing {sp.filter === "badname" ? "accounts without a valid full name" : "students not in any cohort"}.{" "}
              <Link href="/admin/users" className="font-semibold" style={{ color: "#E02020" }}>Clear</Link>
            </p>
          )}

          <div className="overflow-x-auto rounded-xl" style={cardStyle}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ background: "#f9fafb", color: "#6b7280" }}>
                  <th className="px-4 py-2.5 font-semibold">Name</th><th className="px-4 py-2.5 font-semibold">Role</th><th className="px-4 py-2.5 font-semibold">Cohorts</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center" style={{ color: "#6b7280" }}>No users match.</td></tr>}
                {users.map((u) => (
                  <tr key={u.UserID} style={{ borderTop: "0.5px solid #e5e7eb", background: u.UserID === sp.u ? "rgba(224,32,32,0.05)" : undefined }}>
                    <td className="px-4 py-3">
                      <Link href={link(u.UserID)} className="font-semibold text-gray-900 no-underline">{u.FullName ?? "(no name)"}</Link>
                      <br /><span className="text-xs" style={{ color: "#6b7280" }}>{u.Email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: ROLE_CHIP[u.Role].bg, color: ROLE_CHIP[u.Role].fg }}>{ROLE_LABEL[u.Role]}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#6b7280" }}>
                      {u.Role === "ADMIN" ? "All cohorts" : u.cohortMemberships.map((m) => m.cohort.CohortName).join(", ") || "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {found.length === 300 && <p className="text-xs mt-2" style={{ color: "#6b7280" }}>Showing the first 300. Use search to narrow down.</p>}
        </div>

        {selected && (
          <div className="xl:w-80 xl:shrink-0">
            <UserPanel
              key={selected.UserID}
              user={{ id: selected.UserID, name: selected.FullName ?? selected.Email, email: selected.Email, role: selected.Role, joined: selected.DateCreated.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium" }) }}
              memberships={selected.cohortMemberships.map((m) => ({ id: m.cohort.CohortID, name: m.cohort.CohortName }))}
              allCohorts={cohorts.map((c) => ({ id: c.CohortID, name: c.CohortName }))}
              isSelf={selected.UserID === session?.user?.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
