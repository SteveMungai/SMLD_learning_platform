import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Layers, Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LessonsPageClient, { type CohortOption } from "@/components/LessonsPageClient";
import StatePage from "@/components/StatePage";
import EmptyState from "@/components/EmptyState";

// The Lessons page only lists lessons. Opening one goes to /lessons/[lessonId]/video, where the
// sidebar (Video · Notes · Questions) takes over.
export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  // No valid session means nothing to show, so send people to log in instead of a blank list.
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const role = session.user.role;
  const email = session.user.email ?? null;
  const isStaff = role === "INSTRUCTOR" || role === "ADMIN";

  // Admins see every cohort. Lecturers and students see the cohorts they have been added to.
  const cohorts = await prisma.cohort.findMany({
    where: role === "ADMIN" ? {} : { memberships: { some: { UserID: userId, Status: "ACTIVE" } } },
    orderBy: { CohortName: "asc" },
    include: {
      courses: {
        orderBy: { Title: "asc" },
        include: {
          lessons: {
            orderBy: { SequenceOrder: "asc" },
            include: {
              video: true,
              audio: true,
              notes: { select: { NoteID: true } },
              zoomMeetings: { select: { MeetingID: true } },
              createdBy: { select: { FullName: true } },
            },
          },
        },
      },
    },
  });

  if (cohorts.length === 0) {
    const who = email ? <>Ask them to add this email address: <b className="break-all">{email}</b>.</> : null;
    return (
      <StatePage heading="Lessons">
        {role === "ADMIN" ? (
          <EmptyState icon={Layers} title="No cohorts yet" actions={[{ href: "/admin/cohorts", label: "Create a cohort", primary: true }]}>
            Create a cohort, then add a course and lessons to it.
          </EmptyState>
        ) : role === "INSTRUCTOR" ? (
          <EmptyState icon={Users} title="You haven't been added to a cohort yet" actions={[{ href: "/updates", label: "Go to updates" }]}>
            <p>An admin needs to add you to a cohort before you can create courses and lessons.</p>
            {who && <p className="mt-2">{who}</p>}
          </EmptyState>
        ) : (
          <EmptyState icon={Users} title="You're not in a cohort yet" actions={[{ href: "/join", label: "Join with a code", primary: true }, { href: "/updates", label: "Go to updates" }]}>
            <p>Your lessons appear here as soon as you join a cohort. Got a join code from your lecturer? Use it to join straight away. Otherwise ask your lecturer or an admin to add you.</p>
            {who && <p className="mt-2">{who}</p>}
          </EmptyState>
        )}
      </StatePage>
    );
  }

  const data: CohortOption[] = cohorts.map((c) => ({
    CohortID: c.CohortID,
    CohortName: c.CohortName,
    AcademicYear: c.AcademicYear,
    courses: c.courses.map((course) => ({
      CourseID: course.CourseID,
      Title: course.Title,
      lessons: course.lessons.map((l) => ({
        LessonID: l.LessonID,
        Title: l.Title,
        SequenceOrder: l.SequenceOrder,
        hasVideo: !!l.video,
        hasAudio: !!l.audio,
        hasNotes: l.notes.length > 0,
        hasZoom: l.zoomMeetings.length > 0,
        lecturerName: l.createdBy?.FullName ?? null,
      })),
    })),
  }));

  return <LessonsPageClient cohorts={data} isStaff={isStaff} />;
}
