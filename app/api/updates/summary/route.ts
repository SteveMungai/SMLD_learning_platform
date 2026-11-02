import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarItems, feedWhere, liveWhere, viewerCohorts } from "@/lib/updates";

// Feeds the home page: a pinned banner, the latest announcements and what is coming up.
export async function GET() {
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) return NextResponse.json({ signedIn: false });
  const viewer = { id: user.id, role: user.role };
  try {
    const now = new Date();
    const cohorts = await viewerCohorts(viewer);
    const [latest, pinned, upcoming] = await Promise.all([
      prisma.announcement.findMany({
        where: { AND: [liveWhere(cohorts), feedWhere(viewer, cohorts)] },
        orderBy: [{ PublishAt: "desc" }],
        take: 3,
        select: { AnnouncementID: true, Title: true, Body: true, PublishAt: true, AllCohorts: true, reads: { where: { UserID: user.id }, select: { UserID: true } },
          author: { select: { FullName: true } }, cohorts: { select: { cohort: { select: { CohortName: true } } } } },
      }),
      prisma.announcement.findFirst({
        where: { AND: [liveWhere(cohorts), { Pinned: true }] },
        orderBy: { PublishAt: "desc" },
        select: { AnnouncementID: true, Title: true },
      }),
      calendarItems(viewer, now, new Date(now.getTime() + 30 * 86400_000)),
    ]);
    return NextResponse.json({
      signedIn: true,
      pinned,
      latest: latest.map((a) => ({
        id: a.AnnouncementID, title: a.Title, body: a.Body.slice(0, 140), at: a.PublishAt.toISOString(), unread: a.reads.length === 0,
        author: a.author?.FullName ?? null, audience: a.AllCohorts ? "All cohorts" : a.cohorts.map((c) => c.cohort.CohortName).join(", "),
      })),
      upcoming: upcoming.slice(0, 4).map((i) => ({ ...i, at: i.at.toISOString() })),
    });
  } catch (err) {
    console.error("Updates summary failed:", err);
    return NextResponse.json({ signedIn: true, pinned: null, latest: [], upcoming: [] });
  }
}
