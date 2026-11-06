"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Result } from "@/lib/admin";
import { disableJoinCode, enableJoinCode, replaceJoinCode, setJoinExpiry } from "@/app/admin/actions";

const BORDER = { border: "0.5px solid #e5e7eb" } as const;
const BTN = "rounded-lg px-3 min-h-10 text-xs font-semibold bg-white text-gray-900 disabled:opacity-50";
const formatCode = (c: string) => (c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c);

// The page's own address, known only in the browser (so the link is right on every domain).
const useOrigin = () => useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");

/** Lets an admin share, switch off, replace and expire a cohort's join link. */
export default function JoinLinkPanel({
  cohortId, code, expiresDay, expired,
}: {
  cohortId: string;
  code: string | null;
  expiresDay: string; // "YYYY-MM-DD", or "" for none
  expired: boolean;
}) {
  const router = useRouter();
  const origin = useOrigin();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [day, setDay] = useState(expiresDay);
  const link = code ? `${origin}/register?code=${code}` : "";

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setMsg(r);
      if (!r.error) router.refresh();
    });

  async function copy(what: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this:", text); // clipboard blocked: let them copy it by hand
    }
  }

  return (
    <section aria-label="Join link" className="rounded-xl p-4 sm:p-5 mb-5" style={BORDER}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">Join link</h3>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={!code ? { background: "#f3f4f6", color: "#374151" } : expired ? { background: "#fef3c7", color: "#92400e" } : { background: "rgba(22,163,74,0.1)", color: "#15803d" }}>
          {!code ? "Off" : expired ? "Expired" : "On"}
        </span>
      </div>

      {!code ? (
        <>
          <p className="text-sm mt-2" style={{ color: "#4b5563" }}>Turn this on to get a link you can share in the cohort&apos;s WhatsApp group. People who open it create an account and are added to this cohort automatically.</p>
          <button className={`${BTN} mt-3`} style={BORDER} disabled={pending} onClick={() => run(() => enableJoinCode(cohortId))}>Turn on join link</button>
        </>
      ) : (
        <>
          <p className="text-sm mt-2" style={{ color: "#4b5563" }}>
            {expired ? `This code expired on ${expiresDay} and no longer works. Replace it, or choose a later date.` : "Share this link or code. Anyone who uses it joins this cohort as a student."}
          </p>
          <p className="mt-3 text-2xl font-mono font-bold tracking-widest text-gray-900" aria-label={`Join code ${formatCode(code)}`}>{formatCode(code)}</p>
          <input readOnly aria-label="Join link" value={link} onFocus={(e) => e.currentTarget.select()} className="mt-2 w-full rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-700" style={BORDER} />
          <div className="flex flex-wrap gap-2 mt-3">
            <button className={BTN} style={BORDER} onClick={() => copy("link", link)}>{copied === "link" ? "Copied" : "Copy link"}</button>
            <button className={BTN} style={BORDER} onClick={() => copy("code", formatCode(code))}>{copied === "code" ? "Copied" : "Copy code"}</button>
            <button className={BTN} style={BORDER} disabled={pending} onClick={() => { if (confirm("Replace the code? The old link and code stop working straight away.")) run(() => replaceJoinCode(cohortId)); }}>Replace code</button>
            <button className={BTN} style={{ border: "0.5px solid #C81E1E", color: "#C81E1E" }} disabled={pending} onClick={() => { if (confirm("Turn the join link off? Nobody can join with it until you turn it on again.")) run(() => disableJoinCode(cohortId)); }}>Turn off</button>
          </div>
          <div className="flex flex-wrap items-end gap-2 mt-4">
            <label className="text-xs font-semibold" style={{ color: "#6b7280" }}>
              Stops working after (optional)
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="block mt-1.5 rounded-lg px-3 py-2.5 text-base sm:text-sm bg-white text-gray-900 min-h-10" style={BORDER} />
            </label>
            <button className={BTN} style={BORDER} disabled={pending} onClick={() => run(() => setJoinExpiry(cohortId, day))}>Save date</button>
            {expiresDay && <button className={BTN} style={BORDER} disabled={pending} onClick={() => { setDay(""); run(() => setJoinExpiry(cohortId, "")); }}>Never expire</button>}
          </div>
        </>
      )}
      {msg?.error && <p role="alert" className="text-xs font-medium mt-3" style={{ color: "#b91c1c" }}>{msg.error}</p>}
      {msg && !msg.error && msg.message && <p role="status" className="text-xs mt-3" style={{ color: "#374151" }}>{msg.message}</p>}
    </section>
  );
}
