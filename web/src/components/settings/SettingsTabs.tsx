import Link from "next/link";
import { SETTINGS_TABS, type SettingsTab } from "@/lib/data/settings-view";

const LABELS: Record<SettingsTab, string> = { general: "General", alerts: "Alerts", notifications: "Notifications", workspace: "Workspace", crm: "CRM" };

export function SettingsTabs({ active }: { active: SettingsTab }) {
  return (
    <nav className="cor-tabs cor-settings-tabs" aria-label="Settings sections">
      {SETTINGS_TABS.map((tab) => (
        <Link key={tab} className="cor-tab" href={`/settings?tab=${tab}`} aria-current={tab === active ? "page" : undefined} scroll={false}>{LABELS[tab]}</Link>
      ))}
    </nav>
  );
}
