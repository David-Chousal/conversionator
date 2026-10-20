import { formatDay, type IsoDate } from "@/lib/analytics/dates";
import { platformInfo } from "@/lib/data/catalog";
import type { WeekStart } from "@/lib/data/settings-types";
import { shortName } from "@/lib/data/team-view";
import type { Platform, Role } from "@/lib/data/types";
import type { Report } from "./types";
import { nextSend, scheduleLabel, windowLabel } from "./window";

export interface ReportRow {
  id: string;
  name: string;
  contents: string;
  schedule: string | null;
  next: string;
  format: string;
  owner: string;
  issue: string | null;
  canEdit: boolean;
}

interface RowContext {
  today: IsoDate;
  weekStart: WeekStart;
  available: Platform[];
  actor: { id: string; role: Role };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function reportRows(reports: Report[], context: RowContext): ReportRow[] {
  return reports.map((report) => {
    const send = nextSend(report.schedule, context.weekStart, context.today);
    const gone = report.platforms.find((platform) => !context.available.includes(platform));
    return {
      id: report.id,
      name: report.name,
      contents: `${plural(report.metrics.length, "metric")} · ${report.platforms.map((platform) => platformInfo(platform).name).join(", ")} · ${windowLabel(report.window)}`,
      schedule: scheduleLabel(report.schedule, context.weekStart),
      next: send ? `Next ${formatDay(send)} · ${plural(report.recipients.length, "recipient")}` : "Not scheduled",
      format: report.format.toUpperCase(),
      owner: shortName(report.ownerName),
      issue: gone ? `${platformInfo(gone).name} isn't connected anymore.` : null,
      canEdit: report.ownerId === context.actor.id || context.actor.role === "admin",
    };
  });
}
