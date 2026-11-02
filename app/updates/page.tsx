import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/updates";
import FeedView from "@/components/updates/FeedView";
import CalendarView from "@/components/updates/CalendarView";

type Search = Record<string, string | undefined>;

export default async function UpdatesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const user = (await getServerSession(authOptions))?.user;
  if (!user?.id) redirect("/login");
  const viewer = { id: user.id, role: user.role };
  const view = sp.view === "calendar" ? "calendar" : "feed";

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Updates</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Announcements, deadlines and live sessions for your cohorts.</p>
        </div>
        {isStaff(viewer.role) && (
          <Link href="/updates/new" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white no-underline min-h-11 inline-flex items-center" style={{ background: "#C81E1E" }}>
            New announcement
          </Link>
        )}
      </div>

      <div className="flex gap-6 mb-5 text-sm font-semibold" style={{ borderBottom: "0.5px solid #e5e7eb" }}>
        {([["feed", "Feed"], ["calendar", "Calendar"]] as const).map(([v, label]) => (
          <Link key={v} href={`/updates?view=${v}`} aria-current={view === v ? "page" : undefined} className="py-3 no-underline"
            style={{ color: view === v ? "#C81E1E" : "#6b7280", borderBottom: view === v ? "2px solid #C81E1E" : "2px solid transparent" }}>
            {label}
          </Link>
        ))}
      </div>

      {view === "calendar" ? <CalendarView viewer={viewer} sp={sp} /> : <FeedView viewer={viewer} sp={sp} />}
    </main>
  );
}
