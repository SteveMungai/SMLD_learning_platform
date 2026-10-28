"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";

const NAV_LINKS: { label: string; href: string; match?: string[] }[] = [
  { label: "Home", href: "/" },
  { label: "Lessons", href: "/lessons", match: ["/lessons", "/questions", "/notes", "/instructor/notes"] },
  { label: "Grades", href: "/Grades" },
  { label: "About", href: "/about" },
];

function isLinkActive(link: (typeof NAV_LINKS)[number], pathname: string | null) {
  if (link.href === "/") return pathname === "/";
  return (link.match ?? [link.href]).some((prefix) => pathname === prefix || pathname?.startsWith(prefix + "/"));
}

const ROLE_LABEL = { STUDENT: "Student", INSTRUCTOR: "Lecturer", ADMIN: "Admin" } as const;

function initialsOf(name?: string | null, email?: string | null) {
  const source = (name?.trim() || email || "?").replace(/@.*/, "");
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function ProfileMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Signed out: the icon is a plain link to the login page.
  if (status !== "authenticated" || !session?.user) {
    return (
      <Link
        href="/login"
        className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors"
        style={{ borderColor: "#e5e7eb" }}
        aria-label="Log in"
      >
        <svg width="16" height="16" fill="none" stroke="#6b7280" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    );
  }

  const { name, email, role } = session.user;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
        style={{ background: "#E02020" }}
        aria-label={`Signed in as ${name ?? email}. Open account menu`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initialsOf(name, email)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl overflow-hidden shadow-lg"
          style={{ background: "white", border: "0.5px solid #e5e7eb" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "0.5px solid #f3f4f6" }}>
            <p className="text-sm font-semibold text-gray-900 truncate">{name ?? "Signed in"}</p>
            <p className="text-xs truncate" style={{ color: "#6b7280" }}>{email}</p>
            {role && (
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(224,32,32,0.1)", color: "#E02020" }}>
                {ROLE_LABEL[role]}
              </span>
            )}
          </div>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 no-underline"
          >
            <Settings size={15} /> Account settings
          </Link>
          <button
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
            style={{ borderTop: "0.5px solid #f3f4f6" }}
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-14"
        style={{
          background: "white",
          borderBottom: "0.5px solid #e5e7eb",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-8 h-8 flex items-center justify-center "
          >
            <Image
              src="/CITAM-LOGO.png"
              alt="CITAM logo"
              width={32}
              height={32}
              
            />
          </div>
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">SMLD</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(link, pathname);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs font-medium tracking-widest uppercase no-underline transition-colors"
                  style={{ color: isActive ? "#E02020" : "#6b7280" }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right side — account icon + mobile burger */}
        <div className="flex items-center gap-3">
          <ProfileMenu />

          {/* Mobile burger */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" fill="none" stroke="#374151" strokeWidth="1.5" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden flex flex-col"
          style={{ background: "white", borderBottom: "0.5px solid #e5e7eb" }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(link, pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-6 py-3 text-sm font-medium no-underline border-b"
                style={{
                  color: isActive ? "#E02020" : "#374151",
                  borderColor: "#f3f4f6",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
