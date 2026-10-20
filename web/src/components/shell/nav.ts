import type { IconName } from "@/components/ui/icon-paths";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Second key of the "G then letter" shortcut. */
  key: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/analytics", label: "Analytics", icon: "analytics", key: "a" },
  { href: "/connections", label: "Connections", icon: "connections", key: "c" },
  { href: "/data", label: "Data", icon: "data", key: "d" },
  { href: "/reports", label: "Reports", icon: "reports", key: "r" },
  { href: "/team", label: "Team", icon: "team", key: "t" },
  { href: "/settings", label: "Settings", icon: "settings", key: "s" },
];

export function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
