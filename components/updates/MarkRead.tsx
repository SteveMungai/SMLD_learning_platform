"use client";

import { useEffect } from "react";
import { markRead } from "@/app/updates/actions";

/** Marks the shown announcements as read, then tells the navbar bell to recount. */
export default function MarkRead({ ids }: { ids: string[] }) {
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    markRead(key.split(",")).then(() => window.dispatchEvent(new Event("updates:read"))).catch(() => {});
  }, [key]);
  return null;
}
