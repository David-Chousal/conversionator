import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/icon-paths";

interface BannerProps {
  tone?: "caution" | "failed" | "info";
  icon?: IconName;
  action?: ReactNode;
  children: ReactNode;
}

export function Banner({ tone = "caution", icon = "warning", action, children }: BannerProps) {
  const toneClass = tone === "caution" ? "" : ` cor-banner--${tone}`;
  return (
    <div className={`cor-banner${toneClass}`} role={tone === "failed" ? "alert" : "status"}>
      <Icon name={icon} />
      <span>{children}</span>
      {action && <span className="cor-banner__end">{action}</span>}
    </div>
  );
}
