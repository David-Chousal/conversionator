"use client";

import { useState } from "react";
import { useToast } from "@/components/feedback/Toaster";
import type { ReportInput } from "@/lib/reports/types";

type ExportState = { status: "idle" } | { status: "building" } | { status: "failed"; message: string };

const FALLBACK = "The file couldn't be built. Your settings are kept; try again.";

function filenameFrom(response: Response, format: string): string {
  const match = /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "");
  return match?.[1] ?? `report.${format}`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Builds the file on the server and downloads it; failures keep the composer as it is and offer Retry. */
export function useReportExport() {
  const { show } = useToast();
  const [state, setState] = useState<ExportState>({ status: "idle" });

  async function run(input: ReportInput) {
    setState({ status: "building" });
    try {
      const response = await fetch("/reports/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        return setState({ status: "failed", message: body?.message ?? FALLBACK });
      }
      const filename = filenameFrom(response, input.format);
      download(await response.blob(), filename);
      setState({ status: "idle" });
      show({ tone: "ok", title: `Downloaded ${filename}`, detail: input.format === "pdf" ? "Letter size, ready to share." : "One row per campaign, with a total." });
    } catch {
      setState({ status: "failed", message: FALLBACK });
    }
  }

  return { state, run };
}
