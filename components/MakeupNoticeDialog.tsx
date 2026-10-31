"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";

type Person = { StudentID: string; StudentName: string; StudentEmail: string };

type Props = {
  lessonId: string;
  assignmentTitle: string;
  missing: Person[];
  late: Person[];
  onClose: () => void;
};

const DEFAULT_MESSAGE =
  "Please complete and submit this work as soon as you can so you stay on track with the cohort. If something stopped you from submitting on time, just reply to this email and let me know.";

export default function MakeupNoticeDialog({ lessonId, assignmentTitle, missing, late, onClose }: Props) {
  const [audience, setAudience] = useState<"missing" | "late" | "both">(missing.length ? (late.length ? "both" : "missing") : "late");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recipients = audience === "missing" ? missing : audience === "late" ? late : [...missing, ...late];

  async function send() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/grades/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, audience, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't send the emails.");
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  const options: { value: typeof audience; label: string; count: number }[] = [
    { value: "missing", label: "Not submitted", count: missing.length },
    { value: "late", label: "Submitted late", count: late.length },
    { value: "both", label: "Both", count: missing.length + late.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(17,17,17,0.5)" }} role="dialog" aria-modal="true" aria-label="Email makeup notice">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: "0.5px solid #e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "0.5px solid #e5e7eb" }}>
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900"><Mail size={17} /> Email makeup notice</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: "#9ca3af" }}><X size={18} /></button>
        </div>

        {result ? (
          <div className="px-6 py-6 space-y-3 text-sm">
            <p className="font-semibold text-gray-900">
              {result.sent === 0 && result.failed.length === 0 ? "Nobody matched, so no emails were sent." : `Sent ${result.sent} email${result.sent === 1 ? "" : "s"}.`}
            </p>
            {result.failed.length > 0 && (
              <p style={{ color: "#991b1b" }}>Couldn&apos;t email: {result.failed.join(", ")}. Check your mail settings and try again.</p>
            )}
            <button onClick={onClose} className="mt-2 text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ background: "#111111" }}>Done</button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            <p className="text-sm" style={{ color: "#6b7280" }}>
              For <span className="font-semibold text-gray-900">{assignmentTitle}</span>. Each student gets their own email, with replies coming to you.
            </p>

            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Send to</legend>
              <div className="flex flex-wrap gap-2">
                {options.map((o) => (
                  <label
                    key={o.value}
                    className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 cursor-pointer"
                    style={{ border: `0.5px solid ${audience === o.value ? "#E02020" : "#e5e7eb"}`, background: audience === o.value ? "rgba(224,32,32,0.05)" : "#fff", opacity: o.count === 0 ? 0.5 : 1 }}
                  >
                    <input type="radio" name="audience" checked={audience === o.value} disabled={o.count === 0} onChange={() => setAudience(o.value)} className="accent-red-600" />
                    {o.label} <span style={{ color: "#9ca3af" }}>({o.count})</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="notice-msg" className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Message</label>
              <textarea
                id="notice-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 resize-none"
                style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", color: "#111111" }}
              />
              <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>The email also tells each student whether they&apos;re missing the work or were late, and links to the assignment.</p>
            </div>

            {recipients.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-gray-900">Recipients ({recipients.length})</summary>
                <ul className="mt-2 max-h-32 overflow-y-auto space-y-1" style={{ color: "#6b7280" }}>
                  {recipients.map((p) => <li key={p.StudentID}>{p.StudentName} <span style={{ color: "#9ca3af" }}>· {p.StudentEmail}</span></li>)}
                </ul>
              </details>
            )}

            {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(224,32,32,0.06)", color: "#991b1b" }}>{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50" style={{ border: "0.5px solid #e5e7eb", color: "#374151" }}>Cancel</button>
              <button
                onClick={send}
                disabled={sending || recipients.length === 0 || !message.trim()}
                className="text-sm font-semibold text-white px-4 py-2 rounded-lg disabled:opacity-50"
                style={{ background: "#E02020" }}
              >
                {sending ? "Sending…" : `Send to ${recipients.length} student${recipients.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
