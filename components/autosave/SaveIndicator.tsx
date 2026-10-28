"use client";

import { Check, CloudOff, Loader2 } from "lucide-react";
import type { SaveState } from "./useAutosave";

function time(d: Date) {
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export default function SaveIndicator({ state, lastSavedAt, message }: { state: SaveState; lastSavedAt: Date | null; message?: string | null }) {
  let content: React.ReactNode = null;
  let color = "#9ca3af";

  if (state === "saving") {
    content = (<><Loader2 size={13} className="animate-spin" /> Saving…</>);
  } else if (state === "error") {
    color = "#E02020";
    content = (<><CloudOff size={13} /> {message ?? "Couldn't save — retrying"}</>);
  } else if (state === "dirty") {
    content = <>Unsaved changes</>;
  } else if (lastSavedAt) {
    content = (<><Check size={13} /> Draft saved at {time(lastSavedAt)}</>);
  }

  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      {content}
    </span>
  );
}
