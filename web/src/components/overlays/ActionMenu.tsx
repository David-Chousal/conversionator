"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/icon-paths";

interface ActionMenuItemBase {
  label: string;
  icon?: IconName;
  meta?: string;
  danger?: boolean;
}

/** An item either runs a callback or navigates. */
export type ActionMenuItem = ActionMenuItemBase & ({ onSelect: () => void; href?: never } | { href: string; onSelect?: never });

interface ActionMenuProps {
  /** Names the object, e.g. "Meta Ads actions"; used for the trigger and the menu. */
  label: string;
  items: ActionMenuItem[];
}

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')] : [];
}

export function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menuItems(menuRef.current)[0]?.focus();
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const entries = menuItems(menuRef.current);
    const index = entries.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: entries.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      entries[(moves[event.key] + entries.length) % entries.length]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <span className="cor-menu-anchor">
      <button
        ref={triggerRef}
        type="button"
        className="cor-key cor-key--sm cor-key--icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div ref={menuRef} id={menuId} role="menu" aria-label={label} className="cor-menu cor-menu--floating" onKeyDown={onMenuKeyDown}>
          {items.map((item) => {
            const className = item.danger ? "cor-menu__item cor-menu__item--danger" : "cor-menu__item";
            const content = (
              <>
                {item.icon && <Icon name={item.icon} />}
                {item.label}
                {item.meta && <span className="cor-menu__meta">{item.meta}</span>}
              </>
            );
            if (item.href) {
              return <Link key={item.label} role="menuitem" className={className} href={item.href} onClick={() => setOpen(false)}>{content}</Link>;
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={className}
                onClick={() => {
                  close(true);
                  item.onSelect?.();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
