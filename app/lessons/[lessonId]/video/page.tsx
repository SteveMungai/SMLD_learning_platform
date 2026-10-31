import { prisma } from "@/lib/prisma";
import { requireLessonAccess } from "@/lib/lessonAccess";
import LessonShell from "@/components/lessons/LessonShell";
import StudentVideoView from "@/components/lessons/StudentVideoView";
import LecturerVideoView from "@/components/lessons/LecturerVideoView";

export default async function LessonVideoPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { role, isStaff, lesson } = await requireLessonAccess(lessonId);

  const row = await prisma.video.findUnique({ where: { LessonID: lessonId } });
  const video = row ? { title: row.Title, link: row.YoutubeLink } : null;

  return (
    <LessonShell lessonId={lessonId} role={role} topicNumber={lesson.SequenceOrder} title={lesson.Title} align="center">
      {isStaff ? <LecturerVideoView lessonId={lessonId} video={video} /> : <StudentVideoView lessonId={lessonId} video={video} />}
    </LessonShell>
  );
}
