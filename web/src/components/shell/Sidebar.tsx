"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/ui/Icon";
import { Key } from "@/components/ui/Key";
import type { User } from "@/lib/data";
import { NAV_ITEMS, isCurrent } from "./nav";
import { useGoShortcuts } from "./useGoShortcuts";

interface SidebarProps {
  workspaceName: string;
  user: User;
}

function SidebarNav({ workspaceName, user, pathname }: SidebarProps & { pathname: string }) {
  const router = useRouter();
  useGoShortcuts(router.push);

  return (
    <>
      <nav className="cor-side" aria-label="Main">
        <span className="cor-wordmark">COR <span className="cor-tag">{workspaceName}</span></span>
        <div className="cor-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
              <Icon name={item.icon} size={20} />
              {item.label}
              <kbd>G {item.key.toUpperCase()}</kbd>
            </Link>
          ))}
        </div>
        <div className="cor-side__foot">
          <span className="cor-avatar" aria-hidden="true">{user.initials}</span>
          <span className="cor-list__main">
            <strong>{user.name}</strong>
            <span>{user.role === "admin" ? "Admin" : "Member"}</span>
          </span>
          <Key size="sm" iconOnly icon="logout" aria-label="Sign out" style={{ marginLeft: "auto" }} onClick={() => router.push("/login")} />
        </div>
      </nav>
      <nav className="cor-bottomnav" aria-label="Main, compact">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

function CurrentSidebar(props: SidebarProps) {
  return <SidebarNav {...props} pathname={usePathname()} />;
}

/** The pathname is request data on dynamic routes, so the nav renders first and the current page streams in. */
export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<SidebarNav {...props} pathname="" />}>
      <CurrentSidebar {...props} />
    </Suspense>
  );
}
