"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type Options<T> = {
  /** The data to persist. Any change (by deep JSON comparison) triggers a save. */
  data: T;
  /** When false nothing is saved (e.g. preview mode, or the item is already published). */
  enabled: boolean;
  /** Persist the data. Throw on failure. */
  save: (data: T) => Promise<void>;
  /** Quiet period after the last change before saving. */
  delayMs?: number;
};

/**
 * Debounced autosave. The first render is treated as the saved baseline, so
 * nothing is written until the user actually changes something.
 */
export function useAutosave<T>({ data, enabled, save, delayMs = 1500 }: Options<T>) {
  const snapshot = JSON.stringify(data);
  const [state, setState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const savedSnapshot = useRef(snapshot);
  const latest = useRef({ data, snapshot, save });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  // Keep the latest values readable from timers/handlers without re-creating them.
  useLayoutEffect(() => {
    latest.current = { data, snapshot, save };
  });

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const flush = useCallback(async (): Promise<boolean> => {
    clearTimer();
    // Let any running save finish first so saves never overlap.
    if (inFlight.current) await inFlight.current.catch(() => {});
    const { data: d, snapshot: snap, save: fn } = latest.current;
    if (snap === savedSnapshot.current) return true;

    setState("saving");
    const run = fn(d);
    inFlight.current = run;
    try {
      await run;
      savedSnapshot.current = snap;
      setLastSavedAt(new Date());
      setErrorMessage(null);
      // If the user kept typing during the save, stay dirty.
      setState(latest.current.snapshot === snap ? "saved" : "dirty");
      return true;
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : null);
      setState("error");
      return false;
    } finally {
      inFlight.current = null;
    }
  }, []);

  // Schedule a save whenever the data changes.
  useEffect(() => {
    if (!enabled) return;
    if (snapshot === savedSnapshot.current) return;
    setState("dirty");
    clearTimer();
    timer.current = setTimeout(() => {
      flush().then((ok) => {
        // Retry later after a failure (e.g. brief network drop).
        if (!ok) timer.current = setTimeout(() => void flush(), 5000);
      });
    }, delayMs);
    return clearTimer;
  }, [snapshot, enabled, delayMs, flush]);

  // Warn before leaving with unsaved changes, and try to save when the tab is hidden.
  useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (latest.current.snapshot !== savedSnapshot.current) e.preventDefault();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, flush]);

  /** Mark the current data as saved without calling save (after an explicit publish/submit). */
  const markSaved = useCallback(() => {
    clearTimer();
    savedSnapshot.current = latest.current.snapshot;
    setLastSavedAt(new Date());
    setState("saved");
  }, []);

  return { state, lastSavedAt, errorMessage, flush, markSaved };
}
