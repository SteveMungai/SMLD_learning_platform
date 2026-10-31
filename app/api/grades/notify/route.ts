import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const when = (d: Date) =>
  d.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Email makeup feedback to students who have not submitted, or who submitted late.
 * Recipients are worked out here from the database (never taken from the browser), by
 * scanning the cohort roster against the submissions for this lesson's assignment.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user;
  if (!me?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (me.role !== "INSTRUCTOR" && me.role !== "ADMIN") {
    return NextResponse.json({ error: "Only lecturers can send makeup notices." }, { status: 403 });
  }

  let body: { lessonId?: string; audience?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const audience = body.audience === "missing" || body.audience === "late" ? body.audience : "both";
  const message = String(body.message ?? "").trim();
  if (!body.lessonId) return NextResponse.json({ error: "Missing lessonId." }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Write the feedback/instructions students should receive." }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Message is too long (2000 characters maximum)." }, { status: 400 });

  const assignment = await prisma.assignment.findFirst({
    where: { LessonID: body.lessonId, Status: "PUBLISHED" },
    include: {
      lesson: { select: { Title: true, SequenceOrder: true } },
      submissions: { where: { Status: { in: ["SUBMITTED", "LATE"] } }, select: { StudentID: true, SubmittedAt: true } },
    },
  });
  if (!assignment || !assignment.DeadlineDate) {
    return NextResponse.json({ error: "No published assignment for this lesson." }, { status: 404 });
  }
  const deadline = assignment.DeadlineDate;

  const roster = await prisma.cohortMembership.findMany({
    where: { CohortID: assignment.CohortID, Status: "ACTIVE", user: { Role: "STUDENT" } },
    include: { user: { select: { UserID: true, FullName: true, Email: true } } },
  });

  const submittedAt = new Map(assignment.submissions.map((s) => [s.StudentID, s.SubmittedAt]));
  const targets: { email: string; name: string; reason: "missing" | "late" }[] = [];
  for (const m of roster) {
    const at = submittedAt.get(m.user.UserID);
    const reason = at === undefined ? "missing" : at && at > deadline ? "late" : null;
    if (!reason) continue;
    if (audience !== "both" && audience !== reason) continue;
    targets.push({ email: m.user.Email, name: m.user.FullName ?? m.user.Email, reason });
  }
  if (targets.length === 0) {
    return NextResponse.json({ sent: 0, failed: [], message: "Nobody matches — no emails were sent." });
  }

  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const link = `${base}/questions/${body.lessonId}`;
  const lessonName = `Lesson ${assignment.lesson.SequenceOrder}: ${assignment.lesson.Title}`;
  const sender = me.name ?? "your lecturer";

  const send = (t: (typeof targets)[number]) => {
    const first = t.name.split(" ")[0];
    const status =
      t.reason === "missing"
        ? `Our records show you haven't submitted “${assignment.Title}” (${lessonName}), which was due ${when(deadline)}.`
        : `You submitted “${assignment.Title}” (${lessonName}) after the deadline of ${when(deadline)}.`;
    return sendMail({
      to: t.email,
      replyTo: me.email ?? undefined,
      subject: `Makeup work: ${assignment.Title}`,
      text: `Hi ${first},\n\n${status}\n\n${message}\n\nOpen the assignment: ${link}\n\nYou can reply to this email to reach ${sender}.`,
      html: `<p>Hi ${esc(first)},</p><p>${esc(status)}</p><p style="white-space:pre-wrap">${esc(message)}</p><p><a href="${link}" style="background:#E02020;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Open the assignment</a></p><p style="color:#6b7280;font-size:13px">You can reply to this email to reach ${esc(sender)}.</p>`,
    });
  };

  // One email per student (never a shared To/Cc list), a few at a time.
  const failed: string[] = [];
  let sent = 0;
  for (let i = 0; i < targets.length; i += 5) {
    const batch = targets.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(send));
    results.forEach((r, j) => {
      if (r.status === "fulfilled") sent++;
      else {
        console.error("Makeup email failed:", batch[j].email, r.reason);
        failed.push(batch[j].name);
      }
    });
  }

  return NextResponse.json({ sent, failed });
}
