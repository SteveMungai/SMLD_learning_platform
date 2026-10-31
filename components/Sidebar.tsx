"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlayCircle, BookOpen, ClipboardList, ShieldCheck } from "lucide-react";

type SidebarProps = {
  // The lesson whose Video / Notes / Questions these links open.
  lessonId: string;
  // Pass the signed-in user's role so ADMIN-only links only render for admins.
  role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
};

export const lessonLinks = (lessonId: string) => [
  { href: `/lessons/${lessonId}/video`, label: "1. Video", icon: PlayCircle },
  { href: `/lessons/${lessonId}/notes`, label: "2. Notes", icon: BookOpen },
  { href: `/questions/${lessonId}`, label: "3. Questions", icon: ClipboardList },
];

const ADMIN_LINK = { href: "/admin", label: "Admin", icon: ShieldCheck };

export default function Sidebar({ lessonId, role = "STUDENT" }: SidebarProps) {
  const pathname = usePathname();
  const base = lessonLinks(lessonId);
  const links = role === "ADMIN" ? [...base, ADMIN_LINK] : base;

  return (
    <aside
      style={{
        background: "#111111",
        borderRight: "0.5px solid rgba(255,255,255,0.08)",
      }}
      className="hidden lg:flex flex-col w-60 shrink-0 min-h-[calc(100vh-80px)] py-8"
    >
      <nav className="flex flex-col gap-1 px-4" aria-label="Lesson sections">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname?.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
              style={
                isActive
                  ? {
                      background: "rgba(224,32,32,0.12)",
                      color: "#E02020",
                      borderLeft: "2px solid #E02020",
                    }
                  : { color: "rgba(255,255,255,0.6)", borderLeft: "2px solid transparent" }
              }
            >
              <Icon size={18} style={{ color: isActive ? "#E02020" : "rgba(255,255,255,0.4)" }} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// The sidebar is hidden on small screens, so phones get the same three sections as a tab strip.
export function LessonTabs({ lessonId }: { lessonId: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Lesson sections" className="lg:hidden flex gap-2 mb-6 overflow-x-auto">
      {lessonLinks(lessonId).map(({ href, label }) => {
        const isActive = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold"
            style={isActive ? { background: "#E02020", color: "#fff" } : { background: "#f3f4f6", color: "#4b5563" }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
