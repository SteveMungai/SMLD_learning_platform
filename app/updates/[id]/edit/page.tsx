import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eatDay, eatTime } from "@/lib/updates";
import AnnouncementForm from "@/components/updates/AnnouncementForm";
import { formOptions } from "@/components/updates/formData";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) redirect("/login");
  if (user.role === "STUDENT") redirect("/updates");

  const a = await prisma.announcement.findUnique({ where: { AnnouncementID: id }, include: { cohorts: true } });
  if (!a) notFound();
  if (a.AuthorID !== user.id && user.role !== "ADMIN") redirect("/updates");
  const { cohorts, lessons } = await formOptions({ id: user.id, role: user.role });
  const now = new Date();

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit announcement</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "#6b7280" }}>Changes are recorded in the activity log.</p>
      <AnnouncementForm
        cohorts={cohorts}
        lessons={lessons}
        isAdmin={user.role === "ADMIN"}
        announcementId={a.AnnouncementID}
        initial={{
          title: a.Title,
          body: a.Body,
          cohortIds: a.cohorts.map((c) => c.CohortID),
          allCohorts: a.AllCohorts,
          pinned: a.Pinned,
          when: !a.Published ? "draft" : a.PublishAt > now ? "schedule" : "now",
          publishAt: a.PublishAt > now ? `${eatDay(a.PublishAt)}T${eatTime(a.PublishAt)}` : "",
          eventDate: a.EventAt ? eatDay(a.EventAt) : "",
          eventTime: a.EventAt ? eatTime(a.EventAt) : "",
          expiresOn: a.ExpiresAt ? eatDay(a.ExpiresAt) : "",
          lessonId: a.LessonID ?? "",
        }}
      />
    </main>
  );
}
