import { ICON_PATHS, type IconName } from "./icon-paths";

interface IconProps {
  name: IconName;
  size?: 16 | 20;
  /** Give a label only when the icon stands alone and carries meaning. */
  label?: string;
}

export function Icon({ name, size = 16, label }: IconProps) {
  const className = size === 20 ? "cor-ico cor-ico--20" : "cor-ico";
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return (
    <svg className={className} viewBox="0 0 16 16" {...a11y}>
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
