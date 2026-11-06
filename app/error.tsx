"use client";

import { TriangleAlert } from "lucide-react";
import StatePage from "@/components/StatePage";
import EmptyState from "@/components/EmptyState";

// Shown when a page fails while loading. The reference lets whoever looks after the site find the
// exact error in the hosting logs.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatePage>
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        actions={[{ href: "/", label: "Back to home" }]}
        extra={
          <button type="button" onClick={reset} className="inline-flex items-center justify-center rounded-lg px-5 min-h-11 text-sm font-semibold text-white" style={{ background: "#C81E1E" }}>
            Try again
          </button>
        }
      >
        <p>We couldn&apos;t load this page. Please try again in a moment.</p>
        {error.digest && <p className="mt-3 text-xs" style={{ color: "#6b7280" }}>If it keeps happening, tell your admin this reference: {error.digest}</p>}
      </EmptyState>
    </StatePage>
  );
}
