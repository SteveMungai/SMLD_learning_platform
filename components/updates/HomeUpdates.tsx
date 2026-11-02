"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  signedIn: boolean;
  pinned: { AnnouncementID: string; Title: string } | null;
  latest: { id: string; title: string; body: string; at: string; unread: boolean; author: string | null; audience: string }[];
  upcoming: { id: string; kind: "deadline" | "session" | "event"; title: string; at: string; sub: string; href: string }[];
};
const KIND = { deadline: "Assignment due", session: "Live session", event: "Event" } as const;
const BORDER = { border: "0.5px solid #e5e7eb" } as const;
const when = (iso: string) => new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

/** Pinned banner, latest announcements and what is coming up. Shows nothing for signed-out visitors. */
export default function HomeUpdates() {
  const [data, setData] = useState<Summary | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/updates/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Summary | null) => {
        if (!alive || !d?.signedIn) return;
        setData(d);
        try { setDismissed(!!d.pinned && sessionStorage.getItem("dismissed-pin") === d.pinned.AnnouncementID); } catch { /* storage unavailable */ }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!data) return null;
  return (
    <>
      {data.pinned && !dismissed && (
        <div role="status" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm" style={{ background: "rgba(200,30,30,0.08)" }}>
          <span className="min-w-0"><b>Pinned:</b> <Link href={`/updates#a-${data.pinned.AnnouncementID}`} className="underline break-words">{data.pinned.Title}</Link></span>
          <button className="rounded-lg px-3 min-h-9 text-xs font-semibold bg-white text-gray-900" style={BORDER}
            onClick={() => { try { sessionStorage.setItem("dismissed-pin", data.pinned!.AnnouncementID); } catch { /* ignore */ } setDismissed(true); }}>Dismiss</button>
        </div>
      )}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 grid gap-5 md:grid-cols-[1.4fr_1fr]" aria-label="Updates">
        <div className="rounded-xl p-4 sm:p-5 min-w-0" style={BORDER}>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-base font-bold text-gray-900">Latest announcements</h2>
            <Link href="/updates" className="text-sm font-semibold no-underline" style={{ color: "#C81E1E" }}>View all</Link>
          </div>
          {data.latest.length === 0 && <p className="text-sm py-4" style={{ color: "#6b7280" }}>No announcements yet.</p>}
          {data.latest.map((a) => (
            <Link key={a.id} href={`/updates#a-${a.id}`} className="flex gap-3 py-3 no-underline" style={{ borderTop: "0.5px solid #e5e7eb" }}>
              <span aria-hidden="true" className="shrink-0 w-2 h-2 rounded-full mt-2" style={{ background: a.unread ? "#C81E1E" : "transparent" }} />
              <span className="min-w-0">
                {a.unread && <span className="sr-only">Unread. </span>}
                <span className="block text-sm font-semibold text-gray-900 break-words">{a.title}</span>
                <span className="block text-xs mt-0.5" style={{ color: "#6b7280" }}>{a.author ?? "Staff"} · {a.audience} · {when(a.at)}</span>
                <span className="block text-sm mt-1 text-gray-700 break-words">{a.body}{a.body.length >= 140 ? "…" : ""}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="rounded-xl p-4 sm:p-5 min-w-0" style={BORDER}>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-base font-bold text-gray-900">Coming up</h2>
            <Link href="/updates?view=calendar" className="text-sm font-semibold no-underline" style={{ color: "#C81E1E" }}>Calendar</Link>
          </div>
          {data.upcoming.length === 0 && <p className="text-sm py-4" style={{ color: "#6b7280" }}>Nothing due in the next 30 days.</p>}
          {data.upcoming.map((u) => (
            <Link key={u.id} href={u.href} className="block py-3 no-underline" style={{ borderTop: "0.5px solid #e5e7eb" }}>
              <span className="block text-sm font-semibold text-gray-900 break-words">{u.title}</span>
              <span className="block text-xs mt-0.5" style={{ color: "#6b7280" }}>{KIND[u.kind]} · {when(u.at)} · {u.sub}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
