"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdmin, type Result } from "@/lib/admin";
import { fromEat } from "@/lib/updates";
import { sendMail } from "@/lib/mailer";

export type AnnouncementInput = {
  title: string;
  body: string;
  cohortIds: string[];
  allCohorts: boolean;
  pinned: boolean;
  when: "now" | "schedule" | "draft";
  publishAt: string; // "YYYY-MM-DDTHH:mm" in Nairobi time
  eventDate: string; // "" when there is no calendar date
  eventTime: string;
  expiresOn: string; // "" for never
  lessonId: string; // "" for none
  emailCohort: boolean;
};

const MAX_EMAILS = 100;
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function staff() {
  const session = await getServerSession(authOptions);
  const u = session?.user;
  if (!u?.id || (u.role !== "INSTRUCTOR" && u.role !== "ADMIN")) return null;
  return { id: u.id, role: u.role };
}

/** Checks the form and turns it into database fields. Returns an error string or the data. */
async function prepare(input: AnnouncementInput, role: "INSTRUCTOR" | "ADMIN") {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) return "Title and message are required.";
  if (title.length > 120) return "Keep the title under 120 characters.";
  if (body.length > 4000) return "Keep the message under 4000 characters.";
  if (input.allCohorts && role !== "ADMIN") return "Only admins can send to all cohorts.";
  if (!input.allCohorts && input.cohortIds.length === 0) return "Choose at least one cohort.";

  if (!input.allCohorts) {
    const found = await prisma.cohort.count({ where: { CohortID: { in: input.cohortIds } } });
    if (found !== new Set(input.cohortIds).size) return "One of the cohorts no longer exists.";
  }
  let publishAt = new Date();
  if (input.when === "schedule") {
    const [d, t] = input.publishAt.split("T");
    const parsed = fromEat(d ?? "", t);
    if (!parsed) return "Choose a valid date and time to publish.";
    publishAt = parsed;
  }
  let eventAt: Date | null = null;
  if (input.eventDate) {
    eventAt = fromEat(input.eventDate, input.eventTime || "00:00");
    if (!eventAt) return "The calendar date isn't valid.";
  }
  let expiresAt: Date | null = null;
  if (input.expiresOn) {
    expiresAt = fromEat(input.expiresOn, "23:59");
    if (!expiresAt) return "The hide-after date isn't valid.";
  }
  if (input.lessonId && !(await prisma.lesson.findUnique({ where: { LessonID: input.lessonId }, select: { LessonID: true } }))) {
    return "That lesson no longer exists.";
  }
  return {
    title, body, publishAt, eventAt, expiresAt,
    published: input.when !== "draft",
    data: {
      Title: title, Body: body, Pinned: input.pinned, AllCohorts: input.allCohorts,
      Published: input.when !== "draft", PublishAt: publishAt, ExpiresAt: expiresAt, EventAt: eventAt,
      LessonID: input.lessonId || null,
    },
  };
}

function refresh() {
  revalidatePath("/updates", "layout");
  revalidatePath("/");
}

async function emailAudience(id: string, title: string, body: string, input: AnnouncementInput): Promise<string> {
  const people = await prisma.user.findMany({
    where: input.allCohorts
      ? { cohortMemberships: { some: { Status: "ACTIVE" } } }
      : { cohortMemberships: { some: { Status: "ACTIVE", CohortID: { in: input.cohortIds } } } },
    select: { Email: true },
    take: MAX_EMAILS + 1,
  });
  const recipients = people.slice(0, MAX_EMAILS);
  const link = `${process.env.NEXTAUTH_URL ?? ""}/updates#a-${id}`;
  let sent = 0;
  for (let i = 0; i < recipients.length; i += 10) {
    const results = await Promise.allSettled(
      recipients.slice(i, i + 10).map((r) =>
        sendMail({
          to: r.Email,
          subject: `SMLD: ${title}`,
          text: `${body}\n\nRead it on the platform: ${link}`,
          html: `<p>${esc(body).replace(/\n/g, "<br>")}</p><p><a href="${link}">Read it on the platform</a></p>`,
        }),
      ),
    );
    sent += results.filter((r) => r.status === "fulfilled").length;
  }
  const more = people.length > MAX_EMAILS ? ` Only the first ${MAX_EMAILS} people were emailed.` : "";
  return `Emailed ${sent} of ${recipients.length} people.${more}`;
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Result> {
  const me = await staff();
  if (!me) return { error: "Only lecturers and admins can post announcements." };
  const p = await prepare(input, me.role);
  if (typeof p === "string") return { error: p };

  const created = await prisma.announcement.create({
    data: {
      ...p.data,
      AuthorID: me.id,
      cohorts: input.allCohorts ? undefined : { create: [...new Set(input.cohortIds)].map((CohortID) => ({ CohortID })) },
    },
  });
  await logAdmin(me.id, `Announcement ${input.when === "draft" ? "saved as draft" : input.when === "schedule" ? "scheduled" : "posted"}: ${p.title}`, "Announcement", created.AnnouncementID);

  let message: string | undefined;
  if (input.emailCohort && input.when === "now") {
    try {
      message = await emailAudience(created.AnnouncementID, p.title, p.body, input);
    } catch (err) {
      console.error("Announcement email failed:", err);
      message = "Posted, but the emails could not be sent.";
    }
  }
  refresh();
  return { error: null, id: created.AnnouncementID, message };
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<Result> {
  const me = await staff();
  if (!me) return { error: "Only lecturers and admins can edit announcements." };
  const existing = await prisma.announcement.findUnique({ where: { AnnouncementID: id } });
  if (!existing) return { error: "Announcement not found." };
  if (existing.AuthorID !== me.id && me.role !== "ADMIN") return { error: "You can only edit your own announcements." };
  const p = await prepare(input, me.role);
  if (typeof p === "string") return { error: p };
  // Editing something already live must not move it back to the top as if it were new.
  if (input.when === "now" && existing.Published && existing.PublishAt <= new Date()) p.data.PublishAt = existing.PublishAt;

  await prisma.$transaction([
    prisma.announcementCohort.deleteMany({ where: { AnnouncementID: id } }),
    prisma.announcement.update({
      where: { AnnouncementID: id },
      data: { ...p.data, cohorts: input.allCohorts ? undefined : { create: [...new Set(input.cohortIds)].map((CohortID) => ({ CohortID })) } },
    }),
  ]);
  await logAdmin(me.id, `Announcement edited: ${p.title}`, "Announcement", id);
  refresh();
  return { error: null, id };
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  const me = await staff();
  if (!me) return { error: "Only lecturers and admins can delete announcements." };
  const existing = await prisma.announcement.findUnique({ where: { AnnouncementID: id } });
  if (!existing) return { error: null };
  if (existing.AuthorID !== me.id && me.role !== "ADMIN") return { error: "You can only delete your own announcements." };
  await prisma.announcement.delete({ where: { AnnouncementID: id } });
  await logAdmin(me.id, `Announcement deleted: ${existing.Title}`, "Announcement", id);
  refresh();
  return { error: null };
}

/** Called after the feed is shown, so the unread dots and the bell count clear. */
export async function markRead(ids: string[]): Promise<void> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId || ids.length === 0) return;
  const real = await prisma.announcement.findMany({ where: { AnnouncementID: { in: ids.slice(0, 50) } }, select: { AnnouncementID: true } });
  await prisma.announcementRead.createMany({
    data: real.map((a) => ({ AnnouncementID: a.AnnouncementID, UserID: userId })),
    skipDuplicates: true,
  });
}
