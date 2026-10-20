"use client";

import { useEffect, useRef, useState } from "react";
import { previewReportAction } from "@/app/(app)/reports/actions";
import type { ReportContent, ReportInput } from "@/lib/reports/types";

const DEBOUNCE_MS = 350;

/** Rebuilds the preview on the server a moment after the report's contents change. */
export function useReportPreview(input: ReportInput, initial: ReportContent | null, blocked: boolean) {
  const [content, setContent] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { name, metrics, platforms, window, compare } = input;
  const key = JSON.stringify({ name, metrics, platforms, window, compare });
  const first = useRef(key);

  useEffect(() => {
    if (key === first.current || blocked) return;
    let current = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await previewReportAction(JSON.parse(key));
      if (!current) return;
      setLoading(false);
      if (result.ok) {
        setContent(result.data);
        setError(null);
      } else setError(result.message);
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [key, blocked]);

  return { content, error, loading };
}
