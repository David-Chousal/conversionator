import { DataSourceError } from "@/lib/data/errors";
import { validateReport } from "./rules";
import type { Report, ReportActor, ReportContext, ReportInput } from "./types";

const DAY_MS = 86_400_000;
const FORBIDDEN = "Only its owner or an admin can change this report.";

function seedReports(now: number): Report[] {
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY_MS).toISOString();
  const base = { compare: true, recipients: [] as string[] };
  return [
    { ...base, id: "r_monthly", name: "Monthly performance", metrics: ["spend", "leads", "cpl", "roas"], platforms: ["google-ads", "meta-ads", "linkedin-ads"], window: { kind: "last-month" }, format: "pdf", schedule: "monthly", recipients: ["leadership@northwind.co", "finance@northwind.co"], ownerId: "u_david", ownerName: "David Chousal", createdAt: at(60), updatedAt: at(3) },
    { ...base, id: "r_weekly", name: "Weekly spend check", metrics: ["spend", "cpa"], platforms: ["google-ads", "meta-ads"], window: { kind: "rolling", days: 7 }, format: "csv", schedule: "weekly", recipients: ["growth@northwind.co"], ownerId: "u_dakota", ownerName: "Dakota Goldstein", createdAt: at(45), updatedAt: at(9) },
    { ...base, id: "r_linkedin", name: "LinkedIn quarter review", metrics: ["spend", "leads", "cpl"], platforms: ["linkedin-ads"], window: { kind: "rolling", days: 90 }, compare: false, format: "pdf", schedule: "none", ownerId: "u_troy", ownerName: "Troy Edwards", createdAt: at(20), updatedAt: at(14) },
  ];
}

const tidy = (input: ReportInput): ReportInput => ({
  ...input,
  name: input.name.trim(),
  recipients: input.schedule === "none" ? [] : [...new Set(input.recipients.map((email) => email.trim().toLowerCase()).filter(Boolean))],
});

export function createReportStore(now: () => number) {
  let reports = seedReports(now());
  let nextId = 1;

  function editable(id: string, actor: ReportActor): Report {
    const report = reports.find((entry) => entry.id === id);
    if (!report) throw new DataSourceError("not_found", "That report no longer exists.");
    if (report.ownerId !== actor.id && actor.role !== "admin") throw new DataSourceError("not_found", FORBIDDEN);
    return report;
  }

  return {
    list: (): Report[] => [...reports].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    get: (id: string): Report | null => reports.find((entry) => entry.id === id) ?? null,
    save(id: string | null, input: ReportInput, actor: ReportActor, context: ReportContext): Report {
      const clean = tidy(input);
      const errors = validateReport(clean, context);
      if (Object.keys(errors).length > 0) throw new DataSourceError("invalid_input", Object.values(errors).join(" "));
      const stamp = new Date(now()).toISOString();
      if (id === null) {
        const created: Report = { ...clean, id: `r_${now().toString(36)}_${nextId++}`, ownerId: actor.id, ownerName: actor.name, createdAt: stamp, updatedAt: stamp };
        reports = [created, ...reports];
        return created;
      }
      const updated: Report = { ...editable(id, actor), ...clean, updatedAt: stamp };
      reports = reports.map((entry) => (entry.id === id ? updated : entry));
      return updated;
    },
    remove(id: string, actor: ReportActor) {
      editable(id, actor);
      reports = reports.filter((entry) => entry.id !== id);
    },
  };
}

export type ReportStore = ReturnType<typeof createReportStore>;
