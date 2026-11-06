import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Action = { href: string; label: string; primary?: boolean };

/**
 * A friendly "nothing here yet" or "can't show this" card: what happened, what to do next.
 * Used instead of blank pages, bare "not found" text or error screens.
 */
export default function EmptyState({
  icon: Icon, title, children, actions = [], extra,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  actions?: Action[];
  extra?: React.ReactNode;
}) {
  return (
    <div role="status" className="mx-auto w-full max-w-xl rounded-2xl p-6 sm:p-10 text-center bg-white" style={{ border: "0.5px solid #e5e7eb" }}>
      <span className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-4" style={{ background: "rgba(200,30,30,0.08)", color: "#C81E1E" }}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{title}</h2>
      {children && <div className="mt-2 text-sm leading-relaxed break-words" style={{ color: "#4b5563" }}>{children}</div>}
      {(actions.length > 0 || extra) && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
          {actions.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className="inline-flex items-center justify-center rounded-lg px-5 min-h-11 text-sm font-semibold no-underline"
              style={a.primary ? { background: "#C81E1E", color: "#fff" } : { background: "#fff", color: "#111", border: "0.5px solid #e5e7eb" }}
            >
              {a.label}
            </Link>
          ))}
          {extra}
        </div>
      )}
    </div>
  );
}
