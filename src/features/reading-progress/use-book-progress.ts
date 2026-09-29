"use client";

import { useMemo, useSyncExternalStore } from "react";
import { type BookProgress, parseProgress, readRawProgress } from "./progress-store";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** undefined = not read yet (server render / first paint), null = nothing saved. */
export function useBookProgress(bookSlug: string): BookProgress | null | undefined {
  // The snapshot must be a primitive (the raw string) so React sees a stable value between reads.
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => readRawProgress(bookSlug),
    () => undefined,
  );
  return useMemo(() => (raw === undefined ? undefined : parseProgress(raw)), [raw]);
}
