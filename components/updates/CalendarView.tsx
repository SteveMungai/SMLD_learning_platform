import Link from "next/link";
import { calendarItems, eatDay, eatMidnight, eatTime, KIND_LABEL, type CalendarItem, type Viewer } from "@/lib/updates";

const BORDER = { border: "0.5px solid #e5e7eb" } as const;
const WEEKDAYS = [["M", "Mon"], ["T", "Tue"], ["W", "Wed"], ["T", "Thu"], ["F", "Fri"], ["S", "Sat"], ["S", "Sun"]] as const;
const KIND_STYLE: Record<CalendarItem["kind"], { background: string; color: string; border: string }> = {
  deadline: { background: "#C81E1E", color: "#fff", border: "0.5px solid #C81E1E" },
  session: { background: "#111", color: "#fff", border: "0.5px solid #111" },
  event: { background: "#fff", color: "#374151", border: "0.5px solid #374151" },
};

const monthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

export default async function CalendarView({ viewer, sp }: { viewer: Viewer; sp: Record<string, string | undefined> }) {
  const today = eatDay(new Date());
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? (sp.month as string) : today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const prev = m === 1 ? monthKey(y - 1, 12) : monthKey(y, m - 1);
  const next = m === 12 ? monthKey(y + 1, 1) : monthKey(y, m + 1);
  const start = eatMidnight(`${month}-01`);
  const end = eatMidnight(`${next}-01`);
  const days = Math.round((end.getTime() - start.getTime()) / 86400_000);
  const lead = (new Date(`${month}-01T00:00:00Z`).getUTCDay() + 6) % 7; // Monday first

  const items = await calendarItems(viewer, start, end);
  const byDay = new Map<string, CalendarItem[]>();
  for (const it of items) {
    const k = eatDay(it.at);
    byDay.set(k, [...(byDay.get(k) ?? []), it]);
  }
  const firstWithItems = [...byDay.keys()].sort()[0];
  const selected = sp.day && sp.day.startsWith(month) ? sp.day : today.startsWith(month) ? today : firstWithItems ?? `${month}-01`;
  const selectedItems = byDay.get(selected) ?? [];

  const label = new Intl.DateTimeFormat("en-KE", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${month}-01T00:00:00Z`));
  const selectedLabel = new Intl.DateTimeFormat("en-KE", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${selected}T00:00:00Z`));
  const link = (mk: string, day?: string) => `/updates?view=calendar&month=${mk}${day ? `&day=${day}` : ""}#agenda`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Link href={link(prev)} aria-label="Previous month" className="w-11 h-11 rounded-lg flex items-center justify-center no-underline text-gray-900" style={BORDER}>&#8249;</Link>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 min-w-40 text-center">{label}</h2>
          <Link href={link(next)} aria-label="Next month" className="w-11 h-11 rounded-lg flex items-center justify-center no-underline text-gray-900" style={BORDER}>&#8250;</Link>
          <Link href={link(today.slice(0, 7), today)} className="rounded-lg px-3 h-11 inline-flex items-center text-xs font-semibold no-underline text-gray-900" style={BORDER}>Today</Link>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          {(Object.keys(KIND_LABEL) as CalendarItem["kind"][]).map((k) => (
            <span key={k} className="rounded-md px-2.5 py-1" style={KIND_STYLE[k]}>{KIND_LABEL[k]}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 lg:items-start">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] font-bold uppercase tracking-wide text-center" style={{ color: "#6b7280" }}>
            {WEEKDAYS.map(([short, long], i) => (
              <span key={i}><span className="sm:hidden" aria-hidden="true">{short}</span><span className="hidden sm:inline">{long}</span><span className="sr-only sm:hidden">{long}</span></span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: lead }, (_, i) => <div key={`b${i}`} aria-hidden="true" />)}
            {Array.from({ length: days }, (_, i) => {
              const day = `${month}-${String(i + 1).padStart(2, "0")}`;
              const list = byDay.get(day) ?? [];
              const isSel = day === selected;
              const isToday = day === today;
              return (
                <Link key={day} href={link(month, day)} aria-label={`${i + 1} ${label}, ${list.length} item${list.length === 1 ? "" : "s"}`}
                  aria-current={isSel ? "date" : undefined}
                  className="min-h-14 sm:min-h-24 rounded-lg p-1 sm:p-1.5 flex flex-col gap-1 no-underline overflow-hidden"
                  style={{ border: isSel ? "1.5px solid #C81E1E" : "0.5px solid #e5e7eb", background: isSel ? "rgba(200,30,30,0.04)" : "#fff" }}>
                  <span className="text-xs font-semibold self-start px-1 rounded-full" style={{ background: isToday ? "#C81E1E" : "transparent", color: isToday ? "#fff" : "#374151" }}>{i + 1}</span>
                  {/* Phones: small dots. Larger screens: titles. */}
                  <span className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                    {list.slice(0, 4).map((it) => <span key={it.id} className="w-2 h-2 rounded-full" style={{ background: KIND_STYLE[it.kind].background, border: KIND_STYLE[it.kind].border }} />)}
                  </span>
                  <span className="hidden sm:flex flex-col gap-0.5" aria-hidden="true">
                    {list.slice(0, 2).map((it) => <span key={it.id} className="rounded px-1.5 py-0.5 text-[11px] font-semibold truncate" style={KIND_STYLE[it.kind]}>{it.title}</span>)}
                    {list.length > 2 && <span className="text-[11px]" style={{ color: "#6b7280" }}>+{list.length - 2} more</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside id="agenda" className="rounded-xl p-4 sm:p-5 lg:w-80 scroll-mt-20" style={BORDER}>
          <h3 className="text-base font-bold text-gray-900">{selectedLabel}</h3>
          <p className="text-xs mb-2" style={{ color: "#6b7280" }}>{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} · Nairobi time</p>
          {selectedItems.length === 0 && <p className="text-sm py-4" style={{ color: "#6b7280" }}>Nothing scheduled for this day.</p>}
          {selectedItems.map((it) => (
            <div key={it.id} className="py-3" style={{ borderTop: "0.5px solid #e5e7eb" }}>
              <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-bold mb-1.5" style={KIND_STYLE[it.kind]}>{KIND_LABEL[it.kind]}</span>
              <Link href={it.href} className="block text-sm font-semibold text-gray-900 no-underline break-words">{it.title}</Link>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{eatTime(it.at)} · {it.sub}</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
