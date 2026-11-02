"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAnnouncement } from "@/app/updates/actions";

export default function DeleteAnnouncementButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button className="text-xs font-semibold disabled:opacity-50" style={{ color: "#C81E1E" }} disabled={pending}
        onClick={() => {
          if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
          start(async () => {
            const r = await deleteAnnouncement(id);
            if (r.error) setError(r.error);
            else router.refresh();
          });
        }}>
        Delete
      </button>
      {error && <span role="alert" className="text-xs" style={{ color: "#b91c1c" }}>{error}</span>}
    </>
  );
}
