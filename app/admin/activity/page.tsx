import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardStyle, formatEAT } from "@/lib/admin";

type Search = Record<string, string | undefined>;
const PAGE_SIZE = 25;

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where = {
    ...(sp.admin ? { AdminID: sp.admin } : {}),
    ...(sp.q ? { Action: { contains: sp.q, mode: "insensitive" as const } } : {}),
  };
  const [rows, total, admins] = await Promise.all([
    prisma.adminLog.findMany({ where, orderBy: { Timestamp: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { admin: { select: { FullName: true, Email: true } } } }),
    prisma.adminLog.count({ where }),
    prisma.user.findMany({ where: { Role: "ADMIN" }, select: { UserID: true, FullName: true, Email: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const q = new URLSearchParams();
    if (sp.admin) q.set("admin", sp.admin);
    if (sp.q) q.set("q", sp.q);
    q.set("page", String(p));
    return `/admin/activity?${q.toString()}`;
  };
  const field = "rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900";

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Activity log</h1>
      <p className="text-sm mt-1 mb-5" style={{ color: "#6b7280" }}>A record of every admin change. Times are in Nairobi time (EAT).</p>

      <form action="/admin/activity" className="flex flex-wrap gap-2 mb-4">
        <select name="admin" defaultValue={sp.admin ?? ""} aria-label="Admin" className={field} style={cardStyle}>
          <option value="">All admins</option>
          {admins.map((a) => <option key={a.UserID} value={a.UserID}>{a.FullName ?? a.Email}</option>)}
        </select>
        <input name="q" defaultValue={sp.q} aria-label="Search the log" placeholder="Search, e.g. role, cohort, lesson" className={`${field} flex-1 min-w-48`} style={cardStyle} />
        <button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#E02020" }}>Filter</button>
      </form>

      <div className="overflow-x-auto rounded-xl" style={cardStyle}>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs" style={{ background: "#f9fafb", color: "#6b7280" }}>
            <th className="px-4 py-2.5 font-semibold">When</th><th className="px-4 py-2.5 font-semibold">Admin</th><th className="px-4 py-2.5 font-semibold">What happened</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center" style={{ color: "#6b7280" }}>No activity recorded yet. Changes made on the admin pages appear here.</td></tr>}
            {rows.map((r) => (
              <tr key={r.LogID} style={{ borderTop: "0.5px solid #e5e7eb" }}>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#6b7280" }}>{formatEAT(r.Timestamp)}</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.admin.FullName ?? r.admin.Email}</td>
                <td className="px-4 py-3">{r.Action}<span className="ml-2 text-xs" style={{ color: "#6b7280" }}>{r.TargetType}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm" style={{ color: "#6b7280" }}>
        <span>{total} entr{total === 1 ? "y" : "ies"} · page {Math.min(page, pages)} of {pages}</span>
        <span className="flex gap-2">
          {page > 1 && <Link href={href(page - 1)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-900 no-underline" style={cardStyle}>Previous</Link>}
          {page < pages && <Link href={href(page + 1)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-900 no-underline" style={cardStyle}>Next</Link>}
        </span>
      </div>
    </div>
  );
}
