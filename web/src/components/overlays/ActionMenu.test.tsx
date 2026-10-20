import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionMenu } from "./ActionMenu";

function setup() {
  const onSync = vi.fn();
  const onDisconnect = vi.fn();
  render(
    <ActionMenu
      label="Meta Ads actions"
      items={[
        { label: "Sync now", icon: "sync", onSelect: onSync },
        { label: "Disconnect", icon: "close", onSelect: onDisconnect, danger: true },
      ]}
    />,
  );
  return { onSync, onDisconnect, trigger: screen.getByRole("button", { name: "Meta Ads actions" }) };
}

describe("ActionMenu", () => {
  test("opens on click and focuses the first item", async () => {
    const { trigger } = setup();
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Sync now" }));
  });

  test("runs the chosen action and closes", async () => {
    const { trigger, onDisconnect } = setup();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Disconnect" }));
    expect(onDisconnect).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  test("moves with arrow keys", async () => {
    const { trigger } = setup();
    await userEvent.click(trigger);
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Disconnect" }));
  });

  test("closes on Escape and returns focus to the trigger", async () => {
    const { trigger } = setup();
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
