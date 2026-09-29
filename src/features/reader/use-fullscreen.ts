"use client";

import { type RefObject, useCallback, useEffect, useState } from "react";

/**
 * Uses the Fullscreen API where it exists; otherwise (e.g. iPhone Safari) falls back to an
 * in-page immersive mode that fills the viewport and keeps the reader controls reachable.
 */
export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [native, setNative] = useState(false);
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    const onChange = () => setNative(document.fullscreenElement !== null && document.fullscreenElement === target.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [target]);

  useEffect(() => {
    if (!immersive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive]);

  const toggle = useCallback(async () => {
    const element = target.current;
    if (!element) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (immersive) {
      setImmersive(false);
      return;
    }
    if (document.fullscreenEnabled && typeof element.requestFullscreen === "function") {
      try {
        await element.requestFullscreen();
        return;
      } catch {
        // Denied or unsupported: fall through to immersive mode.
      }
    }
    setImmersive(true);
  }, [immersive, target]);

  return { isFullscreen: native || immersive, immersive, toggle };
}
