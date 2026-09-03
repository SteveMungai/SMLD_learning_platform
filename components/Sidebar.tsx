"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Award,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";

type SidebarProps = {
  // Pass the signed-in user's role so ADMIN-only links only render for admins.
  role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
};

const BASE_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lessons", label: "lessons", icon: BookOpen },
  { href: "/StudentQuestions", label: "Questions", icon: ClipboardList },
  { href: "/grades", label: "Grades", icon: Award },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
];

const ADMIN_LINK = { href: "/admin", label: "Admin", icon: ShieldCheck };

export default function Sidebar({ role = "STUDENT" }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? [...BASE_LINKS, ADMIN_LINK] : BASE_LINKS;

  return (
    <aside
      style={{
        background: "#111111",
        borderRight: "0.5px solid rgba(255,255,255,0.08)",
      }}
      className="hidden lg:flex flex-col w-60 shrink-0 min-h-[calc(100vh-80px)] py-8"
    >
      <nav className="flex flex-col gap-1 px-4">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname?.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
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