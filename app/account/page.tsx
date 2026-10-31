import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountSettings from "@/components/AccountSettings";
import { isValidFullName } from "@/lib/names";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { UserID: session.user.id },
    select: { FullName: true, Email: true, Role: true, DateCreated: true, Password: true },
  });
  if (!user) redirect("/login");

  return (
    <div style={{ background: "#ffffff" }} className="min-h-screen flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1 px-6 py-16 max-w-3xl w-full mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Account settings</h1>
        <p className="text-sm mb-10" style={{ color: "#6b7280" }}>Manage your profile and password.</p>
        <AccountSettings
          name={user.FullName}
          nameIsValid={isValidFullName(user.FullName)}
          email={user.Email}
          role={user.Role}
          memberSince={user.DateCreated.toISOString()}
          hasPassword={!!user.Password}
        />
      </main>
      <Footer />
    </div>
  );
}
