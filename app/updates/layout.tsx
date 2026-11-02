import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Announcements and the calendar are for signed-in people only.
export default async function UpdatesLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return (
    <>
      <Navbar />
      <div className="flex-1 bg-white">{children}</div>
      <Footer />
    </>
  );
}
