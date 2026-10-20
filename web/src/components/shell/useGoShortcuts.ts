"use client";

import { useEffect } from "react";
import { NAV_ITEMS } from "./nav";

const PREFIX_WINDOW_MS = 1000;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** "G then letter" navigation (G A → Analytics). Ignored while typing in a field. */
export function useGoShortcuts(navigate: (href: string) => void) {
  useEffect(() => {
    let prefixAt = 0;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      const now = Date.now();

      if (now - prefixAt < PREFIX_WINDOW_MS) {
        prefixAt = 0;
        const item = NAV_ITEMS.find((nav) => nav.key === key);
        if (item) {
          event.preventDefault();
          navigate(item.href);
        }
        return;
      }
      if (key === "g") prefixAt = now;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);
}
