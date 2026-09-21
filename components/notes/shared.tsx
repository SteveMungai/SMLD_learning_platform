// components/notes/shared.tsx
// Shared design tokens + building blocks for the Notes / Assignments UI.
// Palette and hero treatment follow the reference design: black hero band
// with a red circle, serif display type, cream body, outlined tag pills.

export const colors = {
  red: "#E02020",
  redDark: "#B51818",
  black: "#111111",
  white: "#FFFFFF",
  cream: "#F5F3EE",
  sectionBg: "#EFEDE6",
  border: "#E3E0D8",
  muted: "#8A8677",
  success: "#15803D",
};

type TagTone = "red" | "black" | "success" | "muted";

const tagColor: Record<TagTone, string> = {
  red: colors.red,
  black: colors.black,
  success: colors.success,
  muted: colors.muted,
};

// Outlined rectangular pill — "Notes", "Video", "Submitted", "Past due", etc.
export function Tag({ label, tone = "black" }: { label: string; tone?: TagTone }) {
  const c = tagColor[tone];
  return (
    <span
      className="inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold border"
      style={{ borderColor: c, color: c }}
    >
      {label}
    </span>
  );
}

// Black hero band with a red circle, matching the reference screenshot.
export function NotesHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: colors.black }}>
      <div
        className="absolute -right-16 -top-20 w-72 h-72 sm:w-80 sm:h-80 rounded-full"
        style={{ backgroundColor: colors.red, opacity: 0.92 }}
      />
      <div
        className="absolute right-8 -top-4 w-80 h-80 sm:w-96 sm:h-96 rounded-full border pointer-events-none"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      />
      <div className="relative max-w-3xl mx-auto px-4 py-14 sm:py-16">
        <p className="text-xs sm:text-sm font-medium text-white/70 mb-4">{eyebrow}</p>
        <h1
          className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] mb-4 max-w-xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {title}
        </h1>
        <p className="text-white/70 text-sm sm:text-base max-w-md">{subtitle}</p>
      </div>
    </div>
  );
}