import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  status?: ReactNode;
  actions?: ReactNode;
}

export function TopBar({ title, status, actions }: TopBarProps) {
  return (
    <header className="cor-top">
      <h1 className="cor-top__title">{title}</h1>
      <div className="cor-top__end">
        {status}
        {actions}
      </div>
    </header>
  );
}
