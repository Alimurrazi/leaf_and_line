"use client";

import { useEffect } from "react";
import { keyToAction } from "./keyboard";

export function useReaderKeyboard({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const action = keyToAction(event, event.target);
      if (!action) return;
      event.preventDefault();
      if (action === "next") onNext();
      else onPrevious();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNext, onPrevious]);
}
