"use client";

import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/components/feedback/Toaster";
import type { ActionResult } from "@/lib/actions/admin";

const SAVED_MS = 2000;

/** Per-section saving: the key reads "Saved" for two seconds after; failures toast. */
export function useSectionSave() {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), SAVED_MS);
    return () => clearTimeout(timer);
  }, [saved]);

  function save(run: () => Promise<ActionResult<unknown>>, failedTitle: string) {
    startTransition(async () => {
      const result = await run();
      if (result.ok) setSaved(true);
      else show({ tone: "failed", title: failedTitle, detail: result.message });
    });
  }

  return { busy, saved, save, edited: () => setSaved(false) };
}
