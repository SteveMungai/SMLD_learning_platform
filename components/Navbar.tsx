"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Lessons", href: "/lessons" },
  { label: "Assignments", href: "/assignments" },
  { label: "About", href: "/about" },
];

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
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ background: "#E02020" }}
          >
            CITAM
          </div>
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">SMLD</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);

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
          <Link
            href="/login"
            className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors"
            style={{ borderColor: "#e5e7eb" }}
            aria-label="Account"
          >
            <svg width="16" height="16" fill="none" stroke="#6b7280" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

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
            const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);

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
