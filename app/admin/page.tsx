import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isValidFullName } from "@/lib/names";
import { cardStyle, formatEAT } from "@/lib/admin";

export default async function AdminOverviewPage() {
  const [students, lecturers, cohorts, toGrade, names, noCohort, emptyCohorts, noLecturer, recent] = await Promise.all([
    prisma.user.count({ where: { Role: "STUDENT" } }),
    prisma.user.count({ where: { Role: "INSTRUCTOR" } }),
    prisma.cohort.count(),
    prisma.submission.count({
      where: { Status: { in: ["SUBMITTED", "LATE"] }, OR: [{ grade: { is: null } }, { grade: { Status: "PENDING" } }] },
    }),
    prisma.user.findMany({ select: { FullName: true } }),
    prisma.user.count({ where: { Role: "STUDENT", cohortMemberships: { none: { Status: "ACTIVE" } } } }),
    prisma.cohort.count({ where: { courses: { none: { lessons: { some: {} } } } } }),
    prisma.lesson.count({ where: { CreatedByID: null } }),
    prisma.adminLog.findMany({ orderBy: { Timestamp: "desc" }, take: 5, include: { admin: { select: { FullName: true, Email: true } } } }),
  ]);
  const badNames = names.filter((n) => !isValidFullName(n.FullName)).length;

  const stats = [
    { label: "Students", value: students },
    { label: "Lecturers", value: lecturers },
    { label: "Cohorts", value: cohorts },
    { label: "Waiting to be graded", value: toGrade, red: true },
  ];
  const attention = [
    { n: badNames, text: `${badNames} account${badNames === 1 ? "" : "s"} without a valid full name`, href: "/admin/users?filter=badname", cta: "Review" },
    { n: noCohort, text: `${noCohort} student${noCohort === 1 ? "" : "s"} not in any cohort`, href: "/admin/users?filter=nocohort", cta: "Assign" },
    { n: emptyCohorts, text: `${emptyCohorts} cohort${emptyCohorts === 1 ? "" : "s"} with no lessons`, href: "/admin/cohorts", cta: "Open" },
    { n: noLecturer, text: `${noLecturer} lesson${noLecturer === 1 ? "" : "s"} with no lecturer recorded`, href: "/admin/courses?filter=nolecturer", cta: "Fix" },
  ].filter((a) => a.n > 0);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Admin overview</h1>
      <p className="text-sm mt-1 mb-7" style={{ color: "#6b7280" }}>Everything at a glance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl p-5" style={cardStyle}>
            <p className="text-xs" style={{ color: "#6b7280" }}>{s.label}</p>
            <p className="text-3xl font-bold mt-1.5" style={{ color: s.red && s.value > 0 ? "#E02020" : "#111" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl p-5" style={cardStyle}>
          <h2 className="text-base font-bold text-gray-900 mb-2">Needs attention</h2>
          {attention.length === 0 && <p className="text-sm py-3" style={{ color: "#6b7280" }}>Nothing needs attention right now.</p>}
          {attention.map((a) => (
            <div key={a.href} className="flex items-center justify-between gap-3 py-3 text-sm" style={{ borderTop: "0.5px solid #e5e7eb" }}>
              <span>{a.text}</span>
              <Link href={a.href} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-900 no-underline" style={cardStyle}>{a.cta}</Link>
            </div>
          ))}
        </section>

        <section className="rounded-xl p-5" style={cardStyle}>
          <h2 className="text-base font-bold text-gray-900 mb-2">Recent activity</h2>
          {recent.length === 0 && <p className="text-sm py-3" style={{ color: "#6b7280" }}>No admin activity yet.</p>}
          {recent.map((r) => (
            <p key={r.LogID} className="py-2.5 text-[13px]" style={{ borderTop: "0.5px solid #e5e7eb" }}>
              <span className="font-semibold">{r.Action}</span>
              <br /><span style={{ color: "#6b7280" }}>{r.admin.FullName ?? r.admin.Email} · {formatEAT(r.Timestamp)}</span>
            </p>
          ))}
          <Link href="/admin/activity" className="inline-block mt-2 text-[13px] font-semibold no-underline" style={{ color: "#E02020" }}>View full activity log</Link>
        </section>
      </div>
    </div>
  );
}
