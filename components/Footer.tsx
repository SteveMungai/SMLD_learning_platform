"use client";

const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="stroke-none">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const IconTwitter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="stroke-none">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const IconInstagram = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/CITAMCC/", Icon: IconFacebook },
  { label: "X (Twitter)", href: "#", Icon: IconTwitter },
  { label: "Instagram", href: "https://www.instagram.com/citam.claycity/", Icon: IconInstagram },
];

export default function Footer() {
  return (
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
            <s.Icon />
          </a>
        ))}
      </div>

      {/* Bottom line */}
      <div className="pt-4 text-center" style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
          CITAM School of Ministry and Leadership Development (SMLD) 2026
          <br />
          All Rights Reserved. SMLD | Christ Is The Answer
        </p>
      </div>
    </footer>
  );
}