"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/courses", label: "Courses & Lessons" },
  { href: "/admin/activity", label: "Activity log" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <aside className="md:w-56 md:shrink-0 px-4 py-3 md:py-8" style={{ background: "#111" }}>
      <nav aria-label="Admin sections" className="flex md:flex-col gap-1 overflow-x-auto text-sm font-semibold">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className="px-4 py-2.5 rounded-lg whitespace-nowrap no-underline"
              style={{
                borderLeft: `2px solid ${active ? "#E02020" : "transparent"}`,
                background: active ? "rgba(224,32,32,0.14)" : "transparent",
                color: active ? "#ff6b6b" : "rgba(255,255,255,0.72)",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
