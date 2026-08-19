"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";


const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Notes", href: "/notes" },
  { label: "Assignments", href: "/assignments" },
  { label: "About", href: "/about" },
];

const PILLARS = [
  {
    number: 1,
    title: "Shepherding",
    description:
      "Pastoral care and discipleship grounded in scripture and rooted in community.",
  },
  {
    number: 2,
    title: "Mobilisation",
    description:
      "Equipping leaders to inspire, organise, and deploy people for effective ministry.",
  },
  {
    number: 3,
    title: "Empowerment",
    description:
      "Practical tools and training for effective leaders in their specific areas of ministry.",
  },
];

const SOCIALS = [
  { label: "Facebook", href: "#", icon: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  {
    label: "X",
    href: "#",
    icon: "M4 4l16 16M20 4 4 20",
  },
  {
    label: "Instagram",
    href: "#",
    icon: "M 7.5 2 C 4.46 2 2 4.46 2 7.5 L 2 16.5 C 2 19.54 4.46 22 7.5 22 L 16.5 22 C 19.54 22 22 19.54 22 16.5 L 22 7.5 C 22 4.46 19.54 2 16.5 2 Z M 12 7 C 14.76 7 17 9.24 17 12 C 17 14.76 14.76 17 12 17 C 9.24 17 7 14.76 7 12 C 7 9.24 9.24 7 12 7 Z M 12 9 A 3 3 0 1 0 12 15 A 3 3 0 0 0 12 9 Z M 17.5 5.5 A 1 1 0 1 1 17.5 7.5 A 1 1 0 0 1 17.5 5.5 Z",
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>

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
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">
            SMLD
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-xs font-medium tracking-widest uppercase no-underline transition-colors"
                style={{ color: link.href === "/" ? "#E02020" : "#6b7280" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-6 py-3 text-sm font-medium no-underline border-b"
              style={{
                color: link.href === "/" ? "#E02020" : "#374151",
                borderColor: "#f3f4f6",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ height: "380px" }}>
        {/* Hero image — swap /hero.jpg for your actual image in /public */}
        <Image
          src="/hero.jpg"
          alt="Open Bible — school of ministry"
          fill
          className="object-cover"
          style={{ filter: "brightness(0.45)" }}
          priority
          // Fallback: if no image, the dark bg below shows
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Dark fallback bg shown when no image */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 60%, #1c0a0a 100%)",
          }}
        />

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p
            className="text-xs font-medium tracking-widest uppercase mb-3"
            style={{ color: "#E02020" }}
          >
            Christ Is The Answer Ministries
          </p>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-white leading-tight"
            style={{ maxWidth: "520px" }}
          >
            School of Ministry and
            <br />
            Leadership Development
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.7)", maxWidth: "400px" }}
          >
            Equipping and developing transformational leaders for kingdom work
            across Africa and beyond.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block px-6 py-3 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: "#E02020" }}
          >
            Start your journey
          </Link>
        </div>
      </section>

      {/* ── Pillars section ── */}
      <section className="px-6 py-16 bg-white">
        <p
          className="text-center text-xs font-medium tracking-widest uppercase mb-2"
          style={{ color: "#E02020" }}
        >
          Leadership Development
        </p>
        <h2 className="text-center text-2xl font-semibold text-gray-900 mb-3">
          Pillars of our programme
        </h2>
        <p
          className="text-center text-sm leading-relaxed mx-auto mb-10"
          style={{ color: "#6b7280", maxWidth: "520px" }}
        >
          The School of Ministry and Leadership Development (SMLD) is a
          training programme for equipping leaders that falls under Pillar 4 of
          CITAM&apos;s strategic plan 2019–2025.
        </p>

        {/* Pillar cards */}
        <div
          className="grid gap-4 mx-auto mb-10"
          style={{
            maxWidth: "720px",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {PILLARS.map((pillar) => (
            <div
              key={pillar.number}
              className="flex flex-col items-center gap-3 rounded-xl p-5"
              style={{
                background: "#f9fafb",
                border: "0.5px solid #e5e7eb",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ background: "#E02020" }}
              >
                {pillar.number}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 text-center">
                {pillar.title}
              </h3>
              <p
                className="text-xs leading-relaxed text-center"
                style={{ color: "#6b7280" }}
              >
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        <p
          className="text-center text-sm leading-relaxed mx-auto"
          style={{ color: "#6b7280", maxWidth: "480px" }}
        >
          Generally, leaders will go through a training programme to prepare
          them for service in their specific areas of ministry.
        </p>
      </section>

      {/* ── CTA section ── */}
      <section
        className="px-6 py-16 text-center"
        style={{ background: "#f9fafb", borderTop: "0.5px solid #e5e7eb", borderBottom: "0.5px solid #e5e7eb" }}
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Start your leadership journey
        </h2>
        <p
          className="text-sm leading-relaxed mx-auto mb-6"
          style={{ color: "#6b7280", maxWidth: "420px" }}
        >
          Don&apos;t miss the opportunity to grow in Christ and lead with
          purpose. Join thousands of disciples in our global learning community.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: "#111111" }}
        >
          Get started now
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#111111" }} className="px-6 pt-10 pb-6">
        {/* Logo + name */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
              style={{ background: "#E02020" }}
            >
              CITAM
            </div>
            <span className="text-sm font-semibold text-white">
              School of Ministry and Leadership Development
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Equipping transformational leaders for kingdom work
          </p>
        </div>

        {/* Connect */}
        <p
          className="text-center text-xs tracking-widest uppercase mb-3"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Connect
        </p>
        <div className="flex justify-center gap-3 mb-8">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{
                border: "0.5px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "#E02020";
                (e.currentTarget as HTMLAnchorElement).style.color = "#E02020";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  "rgba(255,255,255,0.15)";
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.5)";
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d={s.icon} />
              </svg>
            </a>
          ))}
        </div>

        {/* Bottom line */}
        <div
          className="pt-4 text-center"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <p
            className="text-xs leading-relaxed"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            CITAM School of Ministry and Leadership Development (SMLD) 2026
            <br />
            All Rights Reserved. SMLD | Christ Is The Answer
          </p>
        </div>
      </footer>
    </div>
  );
}