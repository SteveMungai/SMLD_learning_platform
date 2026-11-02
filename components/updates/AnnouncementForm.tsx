"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAnnouncement, updateAnnouncement, type AnnouncementInput } from "@/app/updates/actions";

const BORDER = { border: "0.5px solid #e5e7eb" } as const;
const FIELD = "block w-full mt-1.5 rounded-lg px-3 py-3 text-base sm:text-sm bg-white text-gray-900 min-h-11";
const LABEL = "block text-xs font-semibold";
const CHECK = "flex items-center gap-3 py-2 text-sm min-h-11";

const EMPTY: AnnouncementInput = {
  title: "", body: "", cohortIds: [], allCohorts: false, pinned: false, when: "now",
  publishAt: "", eventDate: "", eventTime: "", expiresOn: "", lessonId: "", emailCohort: false,
};

export default function AnnouncementForm({
  cohorts, lessons, isAdmin, announcementId, initial,
}: {
  cohorts: { id: string; name: string }[];
  lessons: { id: string; label: string }[];
  isAdmin: boolean;
  announcementId?: string;
  initial?: Partial<AnnouncementInput>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState<AnnouncementInput>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const set = <K extends keyof AnnouncementInput>(k: K, v: AnnouncementInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggleCohort = (id: string) => set("cohortIds", f.cohortIds.includes(id) ? f.cohortIds.filter((c) => c !== id) : [...f.cohortIds, id]);

  const submitLabel = f.when === "draft" ? "Save draft" : f.when === "schedule" ? "Schedule" : announcementId ? "Save changes" : "Publish now";

  const submit = () =>
    start(async () => {
      setError(null);
      const r = announcementId ? await updateAnnouncement(announcementId, f) : await createAnnouncement(f);
      if (r.error) return setError(r.error);
      if (r.message) return setDone(r.message);
      router.push("/updates");
      router.refresh();
    });

  if (done) {
    return (
      <div className="rounded-xl p-5 text-sm" style={BORDER} role="status">
        <p className="font-semibold text-gray-900">Published.</p>
        <p className="mt-1 text-gray-700">{done}</p>
        <Link href="/updates" className="inline-flex items-center mt-4 rounded-lg px-4 min-h-11 text-sm font-semibold text-white no-underline" style={{ background: "#C81E1E" }}>Back to Updates</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
      <section className="flex-1 min-w-0 rounded-xl p-4 sm:p-6 flex flex-col gap-5" style={BORDER}>
        <label className={LABEL} style={{ color: "#6b7280" }}>Title
          <input className={FIELD} style={BORDER} maxLength={120} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Short and clear" />
        </label>
        <label className={LABEL} style={{ color: "#6b7280" }}>Message
          <textarea className={FIELD} style={BORDER} rows={6} maxLength={4000} value={f.body} onChange={(e) => set("body", e.target.value)} placeholder="What do students need to know?" />
        </label>

        <fieldset className="border-0 p-0 m-0">
          <legend className={LABEL} style={{ color: "#6b7280" }}>Send to</legend>
          {cohorts.length === 0 && <p className="text-sm py-2" style={{ color: "#6b7280" }}>No cohorts exist yet. An admin needs to create one first.</p>}
          {cohorts.map((c) => (
            <label key={c.id} className={CHECK}>
              <input type="checkbox" className="w-5 h-5" checked={!f.allCohorts && f.cohortIds.includes(c.id)} disabled={f.allCohorts} onChange={() => toggleCohort(c.id)} /> {c.name}
            </label>
          ))}
          {isAdmin && (
            <label className={CHECK}>
              <input type="checkbox" className="w-5 h-5" checked={f.allCohorts} onChange={(e) => set("allCohorts", e.target.checked)} /> All cohorts
            </label>
          )}
        </fieldset>

        <label className={LABEL} style={{ color: "#6b7280" }}>Link to a lesson (optional)
          <select className={FIELD} style={BORDER} value={f.lessonId} onChange={(e) => set("lessonId", e.target.value)}>
            <option value="">None</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>

        <div className="rounded-xl p-4" style={BORDER}>
          <p className="text-sm font-semibold text-gray-900">Show on the calendar (optional)</p>
          <div className="grid gap-3 sm:grid-cols-2 mt-1">
            <label className={LABEL} style={{ color: "#6b7280" }}>Date
              <input type="date" className={FIELD} style={BORDER} value={f.eventDate} onChange={(e) => set("eventDate", e.target.value)} /></label>
            <label className={LABEL} style={{ color: "#6b7280" }}>Time (Nairobi)
              <input type="time" className={FIELD} style={BORDER} value={f.eventTime} onChange={(e) => set("eventTime", e.target.value)} /></label>
          </div>
        </div>

        <div>
          <label className={CHECK}><input type="checkbox" className="w-5 h-5" checked={f.pinned} onChange={(e) => set("pinned", e.target.checked)} /> Pin to the top of the feed</label>
          <label className={CHECK}><input type="checkbox" className="w-5 h-5" checked={f.emailCohort} disabled={f.when !== "now"} onChange={(e) => set("emailCohort", e.target.checked)} /> Also email the people it is for (up to 100)</label>
          <label className={`${LABEL} mt-2`} style={{ color: "#6b7280" }}>Hide after (optional)
            <input type="date" className={FIELD} style={BORDER} value={f.expiresOn} onChange={(e) => set("expiresOn", e.target.value)} /></label>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className={LABEL} style={{ color: "#6b7280" }}>When</legend>
          {([["now", "Publish now"], ["schedule", "Schedule for later"], ["draft", "Save as a draft"]] as const).map(([v, l]) => (
            <label key={v} className={CHECK}><input type="radio" name="when" className="w-5 h-5" checked={f.when === v} onChange={() => set("when", v)} /> {l}</label>
          ))}
          {f.when === "schedule" && (
            <label className={LABEL} style={{ color: "#6b7280" }}>Publish at (Nairobi time)
              <input type="datetime-local" className={FIELD} style={BORDER} value={f.publishAt} onChange={(e) => set("publishAt", e.target.value)} /></label>
          )}
        </fieldset>

        {error && <p role="alert" className="text-sm font-medium" style={{ color: "#b91c1c" }}>{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4" style={{ borderTop: "0.5px solid #e5e7eb" }}>
          <Link href="/updates" className="rounded-lg px-5 min-h-11 inline-flex items-center justify-center text-sm font-semibold text-gray-900 no-underline" style={BORDER}>Cancel</Link>
          <button className="rounded-lg px-5 min-h-11 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#C81E1E" }} disabled={pending} onClick={submit}>
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </section>

      <aside className="hidden lg:block w-80 shrink-0">
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>Preview</p>
        <div className="rounded-xl p-5" style={BORDER}>
          {f.pinned && <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold mb-2" style={{ background: "rgba(200,30,30,0.1)", color: "#9b1c1c" }}>Pinned</span>}
          <h3 className="text-base font-bold text-gray-900 break-words">{f.title || "Your title"}</h3>
          <p className="text-sm mt-2 whitespace-pre-wrap break-words text-gray-700">{f.body || "Your message will appear here."}</p>
          {f.eventDate && <p className="inline-block mt-3 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700" style={{ border: "0.5px solid #374151" }}>{f.eventDate} {f.eventTime}</p>}
        </div>
        <p className="text-xs mt-3" style={{ color: "#6b7280" }}>A date also puts it on the calendar for everyone it is sent to.</p>
      </aside>
    </div>
  );
}
