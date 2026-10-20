"use client";

import { useState } from "react";
import { updateNotificationsAction } from "@/app/(app)/settings/actions";
import type { NotificationChannel, NotificationEvent, NotificationPrefs, WeekStart } from "@/lib/data/settings-types";
import { SettingsSection } from "./SettingsSection";
import { useSectionSave } from "./useSectionSave";

interface NotificationsFormProps {
  prefs: NotificationPrefs;
  channels: Record<NotificationEvent, readonly NotificationChannel[]>;
  weekStart: WeekStart;
  /** Admins also hear when someone joins. */
  canManage: boolean;
}

const CHANNEL_TEXT: Record<NotificationChannel, string> = { inApp: "in-app", email: "by email" };

function events(weekStart: WeekStart, canManage: boolean): { key: NotificationEvent; name: string; detail: string }[] {
  return [
    { key: "alerts", name: "Alerts", detail: "Your personal alerts and workspace alerts that tell the workspace" },
    { key: "sync", name: "Sync problems", detail: "A source stops syncing or needs reconnecting" },
    ...(canManage ? [{ key: "team" as const, name: "New members", detail: "Someone joins the workspace from an invitation" }] : []),
    { key: "summary", name: "Weekly summary", detail: `Spend, return and top campaigns, every ${weekStart === "monday" ? "Monday" : "Sunday"} morning` },
  ];
}

/** Which notifications reach you, and where. */
export function NotificationsForm({ prefs, channels, weekStart, canManage }: NotificationsFormProps) {
  const [values, setValues] = useState(prefs);
  const { busy, saved, save, edited } = useSectionSave();

  function toggle(event: NotificationEvent, channel: NotificationChannel) {
    setValues((current) => ({ ...current, [event]: { ...current[event], [channel]: !current[event][channel] } }));
    edited();
  }

  return (
    <SettingsSection id="notifications" title="Notifications" tag="Only you" busy={busy} saved={saved}
      onSubmit={() => save(() => updateNotificationsAction(values), "Couldn't save notifications")}>
      <div className="cor-table-wrap cor-settings-form__wide">
        <table className="cor-table cor-notify-table">
          <colgroup><col /><col className="cor-notify-table__channel" /><col className="cor-notify-table__channel" /></colgroup>
          <thead><tr><th scope="col">Notification</th><th scope="col">In-app</th><th scope="col">Email</th></tr></thead>
          <tbody>
            {events(weekStart, canManage).map((entry) => (
              <tr key={entry.key}>
                <td><span className="cor-list__main"><strong>{entry.name}</strong><span>{entry.detail}</span></span></td>
                {(["inApp", "email"] as NotificationChannel[]).map((channel) => (
                  <td key={channel}>
                    {channels[entry.key].includes(channel) ? (
                      <label className="cor-switch">
                        <input type="checkbox" aria-label={`${entry.name} ${CHANNEL_TEXT[channel]}`} checked={values[entry.key][channel]} onChange={() => toggle(entry.key, channel)} />
                        <span className="cor-switch__state" aria-hidden="true">{values[entry.key][channel] ? "ON" : "OFF"}</span>
                      </label>
                    ) : <span className="cor-tag" title="Not available for this notification">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  );
}
