import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AnnouncementForm from "@/components/updates/AnnouncementForm";
import { formOptions } from "@/components/updates/formData";

export default async function NewAnnouncementPage() {
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) redirect("/login");
  if (user.role === "STUDENT") redirect("/updates");
  const { cohorts, lessons } = await formOptions({ id: user.id, role: user.role });

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">New announcement</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "#6b7280" }}>Lecturers and admins only.</p>
      <AnnouncementForm cohorts={cohorts} lessons={lessons} isAdmin={user.role === "ADMIN"} />
    </main>
  );
}
