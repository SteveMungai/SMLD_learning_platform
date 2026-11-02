import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type Viewer = { id: string; role: "STUDENT" | "INSTRUCTOR" | "ADMIN" };
export const isStaff = (role: Viewer["role"]) => role !== "STUDENT";

export type CalendarItem = {
  id: string;
  kind: "deadline" | "session" | "event";
  title: string;
  at: Date;
  sub: string;
  href: string;
};
export const KIND_LABEL = { deadline: "Assignment due", session: "Live session", event: "Event" } as const;

// Nairobi time (UTC+3) 
const TZ = "Africa/Nairobi";
const EAT_OFFSET_MS = 3 * 3600_000;
/** "2026-11-05" for the Nairobi calendar day of this instant. */
export const eatDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
export const eatTime = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
export const eatLong = (d: Date) => new Intl.DateTimeFormat("en-KE", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
export const eatStamp = (d: Date) => new Intl.DateTimeFormat("en-KE", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" }).format(d);
/** Midnight in Nairobi of a "YYYY-MM-DD" day, as a UTC instant. */
export const eatMidnight = (day: string) => new Date(new Date(`${day}T00:00:00Z`).getTime() - EAT_OFFSET_MS);
/** "2026-11-05" + "14:00" typed in Nairobi time, as a UTC instant (or null if invalid). */
export function fromEat(day: string, time?: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const d = new Date(`${day}T${time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00"}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function googleCalendarUrl(title: string, start: Date, details = "") {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(start.getTime() + 3600_000);
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${f(start)}/${f(end)}`, details });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Students: their active cohorts. Staff: every cohort. */
export async function viewerCohorts(v: Viewer): Promise<string[] | "all"> {
  if (isStaff(v.role)) return "all";
  const rows = await prisma.cohortMembership.findMany({ where: { UserID: v.id, Status: "ACTIVE" }, select: { CohortID: true } });
  return rows.map((r) => r.CohortID);
}

/** Announcements that are live right now and aimed at these cohorts. */
export function liveWhere(cohorts: string[] | "all", now = new Date()): Prisma.AnnouncementWhereInput {
  const live: Prisma.AnnouncementWhereInput = {
    Published: true,
    PublishAt: { lte: now },
    OR: [{ ExpiresAt: null }, { ExpiresAt: { gt: now } }],
  };
  if (cohorts === "all") return live;
  return { AND: [live, { OR: [{ AllCohorts: true }, { cohorts: { some: { CohortID: { in: cohorts } } } }] }] };
}

/** What a person may see in the feed: students see live ones; lecturers also their own drafts; admins everything. */
export function feedWhere(v: Viewer, cohorts: string[] | "all", now = new Date()): Prisma.AnnouncementWhereInput {
  if (v.role === "ADMIN") return {};
  if (v.role === "INSTRUCTOR") return { OR: [liveWhere("all", now), { AuthorID: v.id }] };
  return liveWhere(cohorts, now);
}

export async function unreadCount(v: Viewer): Promise<number> {
  const cohorts = await viewerCohorts(v);
  return prisma.announcement.count({ where: { AND: [liveWhere(cohorts), { reads: { none: { UserID: v.id } } }] } });
}

/** Deadlines, live sessions and dated announcements between two instants. */
export async function calendarItems(v: Viewer, from: Date, to: Date): Promise<CalendarItem[]> {
  const cohorts = await viewerCohorts(v);
  const byCohort = cohorts === "all" ? {} : { CohortID: { in: cohorts } };
  const [assignments, meetings, events] = await Promise.all([
    prisma.assignment.findMany({
      where: { Status: "PUBLISHED", DeadlineDate: { gte: from, lt: to }, ...byCohort },
      select: { AssignmentID: true, Title: true, LessonID: true, DeadlineDate: true, cohort: { select: { CohortName: true } } },
    }),
    prisma.zoomMeeting.findMany({
      where: { MeetingDate: { gte: from, lt: to }, ...(cohorts === "all" ? {} : { lesson: { course: { CohortID: { in: cohorts } } } }) },
      select: { MeetingID: true, Title: true, LessonID: true, MeetingDate: true, lesson: { select: { course: { select: { cohort: { select: { CohortName: true } } } } } } },
    }),
    prisma.announcement.findMany({
      where: { AND: [liveWhere(cohorts), { EventAt: { gte: from, lt: to } }] },
      select: { AnnouncementID: true, Title: true, EventAt: true },
    }),
  ]);
  const items: CalendarItem[] = [
    ...assignments.filter((a) => a.DeadlineDate).map((a) => ({
      id: `a-${a.AssignmentID}`, kind: "deadline" as const, title: a.Title, at: a.DeadlineDate as Date,
      sub: a.cohort.CohortName, href: `/questions/${a.LessonID}`,
    })),
    ...meetings.map((m) => ({
      id: `m-${m.MeetingID}`, kind: "session" as const, title: m.Title, at: m.MeetingDate,
      sub: m.lesson.course.cohort.CohortName, href: `/lessons/${m.LessonID}`,
    })),
    ...events.filter((e) => e.EventAt).map((e) => ({
      id: `e-${e.AnnouncementID}`, kind: "event" as const, title: e.Title, at: e.EventAt as Date,
      sub: "Announcement", href: `/updates#a-${e.AnnouncementID}`,
    })),
  ];
  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}
