import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LessonsPageClient, { type CohortOption } from "@/components/LessonsPageClient";

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const isStaff = role === "INSTRUCTOR" || role === "ADMIN";

  // Students see the cohorts they belong to; lecturers see all (no instructor-to-cohort relation yet).
  // Logged-out visitors get an empty list rather than every cohort's lessons.
  const cohorts = await prisma.cohort.findMany({
    where: isStaff
      ? {}
      : userId
        ? { memberships: { some: { UserID: userId, Status: "ACTIVE" } } }
        : { CohortID: "" },
    orderBy: { CohortName: "asc" },
    include: {
      courses: {
        orderBy: { Title: "asc" },
        include: {
          lessons: {
            orderBy: { SequenceOrder: "asc" },
            include: { video: true, audio: true, notes: { select: { NoteID: true } }, zoomMeetings: { select: { MeetingID: true } } },
          },
        },
      },
    },
  });

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
      })),
    })),
  }));

  return <LessonsPageClient cohorts={data} />;
}
