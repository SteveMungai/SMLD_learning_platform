"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import HomeUpdates from "@/components/updates/HomeUpdates";
import Footer from "@/components/Footer";

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



export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* ── Nav (uses your existing Navbar component, mobile menu included) ── */}
      <Navbar />

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

      <HomeUpdates />

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
      <Footer />
    </div>
  );
}