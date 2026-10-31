import { redirect } from "next/navigation";

// A lesson opens on its first section, Video.
export default async function LessonIndex({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  redirect(`/lessons/${lessonId}/video`);
}
