import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminNav from "@/components/admin/AdminNav";

// Admin only. Every admin action also re-checks the role on the server.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <AdminNav />
        <main className="flex-1 min-w-0 p-6 md:p-10 bg-white">{children}</main>
      </div>
      <Footer />
    </>
  );
}
