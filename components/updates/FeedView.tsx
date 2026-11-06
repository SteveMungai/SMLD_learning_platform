import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";
import { eatLong, eatStamp, feedWhere, googleCalendarUrl, isStaff, viewerCohorts, type Viewer } from "@/lib/updates";
import MarkRead from "@/components/updates/MarkRead";
import DeleteAnnouncementButton from "@/components/updates/DeleteAnnouncementButton";

const BORDER = { border: "0.5px solid #e5e7eb" } as const;
const chip = "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold";
const FILTERS = [["", "All"], ["pinned", "Pinned"], ["unread", "Unread"], ["dated", "With a date"]] as const;

export default async function FeedView({ viewer, sp }: { viewer: Viewer; sp: Record<string, string | undefined> }) {
  const now = new Date();
  const take = Math.min(100, Math.max(10, Number.parseInt(sp.take ?? "20", 10) || 20));
  const filter = sp.filter ?? "";
  const cohorts = await viewerCohorts(viewer);

  const extra: Prisma.AnnouncementWhereInput =
    filter === "pinned" ? { Pinned: true }
    : filter === "unread" ? { reads: { none: { UserID: viewer.id } } }
    : filter === "dated" ? { EventAt: { not: null } }
    : {};
  const rows = await prisma.announcement.findMany({
    where: { AND: [feedWhere(viewer, cohorts, now), extra] },
    orderBy: [{ Pinned: "desc" }, { PublishAt: "desc" }],
    take: take + 1,
    include: {
      author: { select: { FullName: true } },
      cohorts: { include: { cohort: { select: { CohortName: true } } } },
      lesson: { select: { LessonID: true, Title: true, SequenceOrder: true } },
      reads: { where: { UserID: viewer.id }, select: { UserID: true } },
    },
  });
  const hasMore = rows.length > take;
  const items = rows.slice(0, take);
  const unreadIds = items.filter((a) => a.reads.length === 0 && a.Published && a.PublishAt <= now).map((a) => a.AnnouncementID);
  const base = filter ? `/updates?filter=${filter}&` : "/updates?";

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter announcements">
        {FILTERS.map(([value, label]) => (
          <Link key={value} href={value ? `/updates?filter=${value}` : "/updates"} aria-current={filter === value ? "true" : undefined}
            className="rounded-full px-4 py-2 text-xs font-semibold no-underline min-h-9 inline-flex items-center"
            style={{ background: filter === value ? "#111" : "#fff", color: filter === value ? "#fff" : "#111", ...BORDER }}>
            {label}
          </Link>
        ))}
      </div>

      {items.length === 0 && cohorts !== "all" && cohorts.length === 0 && !filter && (
        <EmptyState icon={Users} title="You're not in a cohort yet" actions={[{ href: "/join", label: "Join with a code", primary: true }]}>
          Announcements for your cohort appear here once an admin or lecturer adds you to it.
        </EmptyState>
      )}
      {items.length === 0 && !(cohorts !== "all" && cohorts.length === 0 && !filter) && (
        <p className="text-sm py-10 text-center" style={{ color: "#6b7280" }}>
          {filter ? "Nothing matches this filter." : "No announcements yet. Check back soon."}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {items.map((a) => {
          const unread = a.reads.length === 0 && a.Published && a.PublishAt <= now;
          const audience = a.AllCohorts ? "All cohorts" : a.cohorts.map((c) => c.cohort.CohortName).join(", ");
          const canManage = isStaff(viewer.role) && (viewer.role === "ADMIN" || a.AuthorID === viewer.id);
          const state = !a.Published ? "Draft" : a.PublishAt > now ? `Scheduled for ${eatStamp(a.PublishAt)}` : a.ExpiresAt && a.ExpiresAt <= now ? "Expired" : null;
          return (
            <article key={a.AnnouncementID} id={`a-${a.AnnouncementID}`} className="rounded-xl p-4 sm:p-5 flex gap-3 scroll-mt-20" style={BORDER}>
              <span aria-hidden="true" className="shrink-0 w-2 h-2 rounded-full mt-2" style={{ background: unread ? "#C81E1E" : "transparent" }} />
              <div className="flex-1 min-w-0">
                {unread && <span className="sr-only">Unread. </span>}
                <div className="flex flex-wrap gap-2 mb-1.5 empty:hidden">
                  {a.Pinned && <span className={chip} style={{ background: "rgba(200,30,30,0.1)", color: "#9b1c1c" }}>Pinned</span>}
                  {state && <span className={chip} style={{ background: "#fef3c7", color: "#92400e" }}>{state}</span>}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 break-words">{a.Title}</h2>
                <p className="text-xs mt-0.5 mb-3" style={{ color: "#6b7280" }}>
                  {a.author?.FullName ?? "Staff"} · {audience || "No cohort"} · {eatStamp(a.PublishAt)}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-700">{a.Body}</p>

                {(a.EventAt || a.lesson) && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {a.EventAt && (
                      <>
                        <span className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700" style={{ border: "0.5px solid #374151" }}>{eatLong(a.EventAt)}</span>
                        <a href={googleCalendarUrl(a.Title, a.EventAt, a.Body.slice(0, 200))} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-900 no-underline min-h-9 inline-flex items-center" style={BORDER}>Add to calendar</a>
                      </>
                    )}
                    {a.lesson && (
                      <Link href={`/lessons/${a.lesson.LessonID}`} className="rounded-full px-3 py-1 text-xs font-semibold no-underline" style={{ background: "#f3f4f6", color: "#374151" }}>
                        Lesson {a.lesson.SequenceOrder}: {a.lesson.Title}
                      </Link>
                    )}
                  </div>
                )}

                {canManage && (
                  <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: "0.5px solid #e5e7eb" }}>
                    <Link href={`/updates/${a.AnnouncementID}/edit`} className="text-xs font-semibold no-underline" style={{ color: "#374151" }}>Edit</Link>
                    <DeleteAnnouncementButton id={a.AnnouncementID} title={a.Title} />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="text-center mt-6">
          <Link href={`${base}take=${take + 20}`} className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-900 no-underline min-h-11 inline-flex items-center" style={BORDER}>Load more</Link>
        </div>
      )}
      <MarkRead ids={unreadIds} />
    </div>
  );
}
