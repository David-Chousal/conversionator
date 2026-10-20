import type { ProfileInput, RangeDays, WorkspaceInput } from "./settings-types";

export const RANGE_DAYS: readonly RangeDays[] = [7, 30, 90];
export const CURRENCIES: readonly { code: string; name: string }[] = [
  { code: "USD", name: "US dollar" }, { code: "EUR", name: "Euro" }, { code: "GBP", name: "British pound" },
  { code: "CAD", name: "Canadian dollar" }, { code: "AUD", name: "Australian dollar" }, { code: "JPY", name: "Japanese yen" },
];
export const TIME_ZONES: readonly { id: string; name: string }[] = [
  { id: "America/Los_Angeles", name: "Pacific · Los Angeles" }, { id: "America/Denver", name: "Mountain · Denver" },
  { id: "America/Chicago", name: "Central · Chicago" }, { id: "America/New_York", name: "Eastern · New York" },
  { id: "America/Sao_Paulo", name: "São Paulo" }, { id: "Europe/London", name: "London" }, { id: "Europe/Berlin", name: "Berlin" },
  { id: "Asia/Kolkata", name: "Kolkata" }, { id: "Asia/Singapore", name: "Singapore" }, { id: "Asia/Tokyo", name: "Tokyo" },
  { id: "Australia/Sydney", name: "Sydney" }, { id: "UTC", name: "UTC" },
];
const MAX_NAME = 80;
const MAX_WORKSPACE_NAME = 60;

export type ProfileErrors = Partial<Record<keyof ProfileInput, string>>;
export type WorkspaceErrors = Partial<Record<keyof WorkspaceInput, string>>;

export function validateProfile(input: ProfileInput): ProfileErrors {
  const name = input.name.trim();
  return {
    ...(name === "" ? { name: "Enter your name." } : name.length > MAX_NAME ? { name: `Keep your name under ${MAX_NAME} characters.` } : {}),
    ...(RANGE_DAYS.includes(input.defaultRangeDays) ? {} : { defaultRangeDays: "Pick 7, 30 or 90 days." }),
  };
}

export function validateWorkspaceInput(input: WorkspaceInput): WorkspaceErrors {
  const name = input.name.trim();
  return {
    ...(name === "" ? { name: "Enter a workspace name." } : name.length > MAX_WORKSPACE_NAME ? { name: `Keep the name under ${MAX_WORKSPACE_NAME} characters.` } : {}),
    ...(CURRENCIES.some((entry) => entry.code === input.currency) ? {} : { currency: "Pick a currency from the list." }),
    ...(TIME_ZONES.some((entry) => entry.id === input.timeZone) ? {} : { timeZone: "Pick a time zone from the list." }),
    ...(input.weekStart === "monday" || input.weekStart === "sunday" ? {} : { weekStart: "Weeks start on Monday or Sunday." }),
  };
}

/** Initials from a display name: first and last word. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  return `${words[0]?.[0] ?? ""}${words.length > 1 ? words[words.length - 1][0] : ""}`.toUpperCase();
}
