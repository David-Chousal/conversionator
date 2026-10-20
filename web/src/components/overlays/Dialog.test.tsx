import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  test("renders nothing when closed", () => {
    render(<Dialog open={false} title="Disconnect Meta Ads?" onClose={vi.fn()}>Body</Dialog>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("is labelled by its title and moves focus inside", () => {
    render(<Dialog open title="Disconnect Meta Ads?" onClose={vi.fn()} footer={<button type="button">Cancel</button>}>Body</Dialog>);
    const dialog = screen.getByRole("dialog", { name: "Disconnect Meta Ads?" });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  test("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<Dialog open title="Disconnect Meta Ads?" onClose={onClose}>Body</Dialog>);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  test("keeps Tab focus inside the dialog", async () => {
    render(
      <>
        <button type="button">Outside</button>
        <Dialog open title="Disconnect Meta Ads?" onClose={vi.fn()} footer={<button type="button">Cancel</button>}>Body</Dialog>
      </>,
    );
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  });
});
