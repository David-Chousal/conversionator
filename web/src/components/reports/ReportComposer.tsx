"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { saveReportAction } from "@/app/(app)/reports/actions";
import { Banner } from "@/components/feedback/Banner";
import { useToast } from "@/components/feedback/Toaster";
import { Icon } from "@/components/ui/Icon";
import { Key } from "@/components/ui/Key";
import type { ComposerData } from "@/lib/reports/loader";
import { validateReport } from "@/lib/reports/rules";
import type { ReportInput } from "@/lib/reports/types";
import { DeliverStep, MetricsStep, SourcesStep, WindowStep } from "./ComposerSteps";
import { ReportPaper } from "./ReportPaper";
import { useReportExport } from "./useReportExport";
import { useReportPreview } from "./useReportPreview";

/** Build a report from several channels, preview it live, export it now or schedule it. */
export function ReportComposer(data: ComposerData) {
  const router = useRouter();
  const { show } = useToast();
  const [saving, startTransition] = useTransition();
  const [input, setInput] = useState(data.initial);
  const [attempted, setAttempted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const errors = validateReport(input, { available: data.channels.map((channel) => channel.platform), today: data.today });
  const problem = errors.metrics ?? errors.platforms ?? errors.window ?? null;
  const preview = useReportPreview(input, data.preview, problem !== null);
  const exporter = useReportExport();
  const change = (patch: Partial<ReportInput>) => setInput((current) => ({ ...current, ...patch }));
  const building = exporter.state.status === "building";
  const canExport = !problem && !preview.error && preview.content !== null && !preview.content.empty && !building;

  function save() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return errors.name ? nameRef.current?.focus() : undefined;
    startTransition(async () => {
      const result = await saveReportAction(data.reportId, input);
      if (!result.ok) return show({ tone: "failed", title: "Couldn't save the report", detail: result.message });
      show({ tone: "ok", title: `Saved ${result.data.name}`, detail: result.data.schedule === "none" ? "Find it under Reports." : "It goes out on schedule." });
      if (!data.reportId) router.push(`/reports/${result.data.id}`);
    });
  }

  return (
    <div className="cor-composer">
      <section className="cor-bay cor-composer__form" aria-labelledby="composer-title">
        <div className="cor-bay__head">
          <h2 className="cor-bay__title" id="composer-title">{data.reportId ? "Edit report" : "New report"}</h2>
          <Link className="cor-link" href="/reports">All reports</Link>
        </div>
        {!data.canEdit && <Banner tone="info" icon="lock">Only its owner or an admin can change this report. You can still export it.</Banner>}
        <fieldset className="cor-composer__steps" disabled={!data.canEdit}>
          <div className="cor-fieldset">
            <span className="cor-fieldset__label"><label className="cor-tag" htmlFor="report-name">Report name</label></span>
            <input ref={nameRef} id="report-name" className="cor-input" value={input.name} placeholder="Monthly performance" aria-invalid={attempted && errors.name ? true : undefined} onChange={(event) => change({ name: event.target.value })} />
            {attempted && errors.name && <span className="cor-help cor-help--error"><Icon name="warning" />{errors.name}</span>}
          </div>
          <MetricsStep input={input} errors={errors} data={data} onChange={change} />
          <SourcesStep input={input} errors={errors} data={data} onChange={change} />
          <WindowStep input={input} errors={errors} data={data} onChange={change} />
          <DeliverStep input={input} errors={errors} data={data} onChange={change} showRecipientsError={attempted || input.recipients.length > 0} />
        </fieldset>
        {exporter.state.status === "failed" && (
          <Banner tone="failed" icon="warning" action={<button type="button" className="cor-key cor-key--sm" onClick={() => exporter.run(input)}>Retry</button>}>{exporter.state.message}</Banner>
        )}
        <div className="cor-row cor-composer__keys">
          {data.canEdit && <Key variant="primary" onClick={save} disabled={saving}>Save report</Key>}
          <Key icon="export" onClick={() => exporter.run(input)} disabled={!canExport}>{`Export ${input.format.toUpperCase()}`}</Key>
          <span className="cor-tag" aria-live="polite">{building ? `Building ${input.name.trim() || "report"} · ${input.format.toUpperCase()}…` : ""}</span>
        </div>
      </section>
      <ReportPaper content={preview.content} problem={problem ?? preview.error} loading={preview.loading} />
    </div>
  );
}
