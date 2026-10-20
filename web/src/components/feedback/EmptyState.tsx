import type { ReactNode } from "react";

interface EmptyStateProps {
  status: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ status, title, children, action }: EmptyStateProps) {
  return (
    <div className="cor-empty">
      <div className="cor-empty__card">
        <span className="cor-tag">{status}</span>
        <h2 className="cor-empty__title">{title}</h2>
        <p>{children}</p>
        {action}
      </div>
    </div>
  );
}
